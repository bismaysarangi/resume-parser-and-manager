import zipfile
import os
import tempfile
from typing import List, Dict, Any
from datetime import datetime
import json
import asyncio
from pathlib import Path

# Use your existing parser module (you provided this earlier)
from services import resume_parser  # async parse_resume(file)

ALLOWED_EXT = {".pdf", ".doc", ".docx", ".txt", ".docm"}

# Rate limiting configuration (lighter since model is fixed)
DELAY_BETWEEN_REQUESTS = 0.5  # 0.5 seconds between each resume parse
MAX_CONCURRENT_PARSES = 3  # Process max 3 resumes at a time

def _is_valid_resume(filename: str) -> bool:
    _, ext = os.path.splitext(filename.lower())
    return ext in ALLOWED_EXT

class FileLikeAsyncWrapper:
    """
    Wrap a filesystem path into an object compatible with your parse_resume(file) function:
    - .filename attribute
    - .file attribute (binary file object; pdfplumber and python-docx will use .file)
    - async read() method returning bytes (for txt reading)
    """
    def __init__(self, path: str, filename: str):
        self.path = path
        self.filename = filename
        # We'll open file lazily as needed
        self._file_obj = None

    def _open(self):
        if self._file_obj is None:
            # open in binary mode
            self._file_obj = open(self.path, "rb")
        return self._file_obj

    @property
    def file(self):
        # return file-like object for pdfplumber/docx which expect a file or file-like
        return self._open()

    async def read(self) -> bytes:
        # run blocking read in executor
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, self._open().read)

    def close(self):
        try:
            if self._file_obj:
                self._file_obj.close()
        except Exception:
            pass


async def parse_single_resume_with_retry(wrapper, relpath, max_retries=2):
    """
    Parse a single resume with retry logic and better error handling
    """
    last_error = None
    
    for attempt in range(max_retries):
        try:
            # Call your async parser
            parsed = await resume_parser.parse_resume(wrapper)
            return {"success": True, "data": parsed}
            
        except Exception as e:
            error_msg = str(e)
            last_error = error_msg
            
            # Check if it's a 'choices' error (API error)
            if "'choices'" in error_msg or "choices" in error_msg:
                if attempt < max_retries - 1:
                    wait_time = (attempt + 1) * 3  # 3s, 6s, 9s
                    print(f"API error for {relpath}. Retrying in {wait_time}s (attempt {attempt + 1}/{max_retries})")
                    await asyncio.sleep(wait_time)
                    continue
            
            # For other errors, don't retry
            break
    
    # All retries failed or non-retryable error
    return {"success": False, "error": last_error}


async def process_zip_and_store(zip_path: str, uploader_email: str, db) -> List[Dict[str, Any]]:
    """
    Async: Extract zip at zip_path, parse each supported file with resume_parser.parse_resume,
    store parsed results into MongoDB `resumes` collection using provided `db` (core.database.db).
    Returns list of per-file result dicts: { filename, status, message }
    
    NOW WITH RATE LIMITING AND SEQUENTIAL PROCESSING
    """
    results: List[Dict[str, Any]] = []
    tmpdir = tempfile.mkdtemp(prefix="resumes_unzip_")

    try:
        # Extract zip into tmpdir (blocking; small cost)
        with zipfile.ZipFile(zip_path, "r") as zf:
            zf.extractall(tmpdir)

        resumes_coll = db["resumes"]

        # Collect all valid resume files first
        resume_files = []
        for root, dirs, files in os.walk(tmpdir):
            for fname in files:
                relpath = os.path.relpath(os.path.join(root, fname), tmpdir)
                if not _is_valid_resume(fname):
                    results.append({
                        "filename": relpath,
                        "status": "skipped",
                        "message": "Unsupported file type"
                    })
                else:
                    file_path = os.path.join(root, fname)
                    resume_files.append((file_path, relpath, fname))

        # Process resumes SEQUENTIALLY with delays (prevents rate limiting)
        print(f"Processing {len(resume_files)} valid resumes sequentially...")
        
        for idx, (file_path, relpath, fname) in enumerate(resume_files):
            wrapper = FileLikeAsyncWrapper(file_path, fname)
            
            try:
                print(f"Parsing resume {idx + 1}/{len(resume_files)}: {relpath}")
                
                # Parse with retry logic
                result = await parse_single_resume_with_retry(wrapper, relpath)
                
                if result["success"]:
                    parsed = result["data"]
                    
                    # Create MongoDB document
                    doc = {
                        "filename": relpath,
                        "uploader_email": uploader_email,
                        "parsed": parsed,
                        "raw_stored_at": datetime.utcnow(),
                    }

                    # Insert into MongoDB
                    insert_result = resumes_coll.insert_one(doc)

                    results.append({
                        "filename": relpath,
                        "status": "success",
                        "message": "Parsed and stored",
                        "inserted_id": str(insert_result.inserted_id)
                    })
                else:
                    # Parsing failed after retries
                    results.append({
                        "filename": relpath,
                        "status": "error",
                        "message": f"Failed to parse resume: {result['error'][:200]}"
                    })
                
            except Exception as e:
                # Unexpected error during processing
                results.append({
                    "filename": relpath,
                    "status": "error",
                    "message": f"Unexpected error: {str(e)[:200]}"
                })
            finally:
                wrapper.close()
            
            # Add delay between requests to avoid rate limiting
            # Skip delay after the last file
            if idx < len(resume_files) - 1:
                print(f"Waiting {DELAY_BETWEEN_REQUESTS}s before next resume...")
                await asyncio.sleep(DELAY_BETWEEN_REQUESTS)

    finally:
        # Cleanup extracted files and tempdir
        try:
            for root, dirs, files in os.walk(tmpdir, topdown=False):
                for name in files:
                    try:
                        os.remove(os.path.join(root, name))
                    except Exception:
                        pass
                for name in dirs:
                    try:
                        os.rmdir(os.path.join(root, name))
                    except Exception:
                        pass
            try:
                os.rmdir(tmpdir)
            except Exception:
                pass
        except Exception:
            pass

    return results