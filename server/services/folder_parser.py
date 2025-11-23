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

async def process_zip_and_store(zip_path: str, uploader_email: str, db) -> List[Dict[str, Any]]:
    """
    Async: Extract zip at zip_path, parse each supported file with resume_parser.parse_resume,
    store parsed results into MongoDB `resumes` collection using provided `db` (core.database.db).
    Returns list of per-file result dicts: { filename, status, message }
    """
    results: List[Dict[str, Any]] = []
    tmpdir = tempfile.mkdtemp(prefix="resumes_unzip_")

    try:
        # Extract zip into tmpdir (blocking; small cost)
        with zipfile.ZipFile(zip_path, "r") as zf:
            zf.extractall(tmpdir)

        resumes_coll = db["resumes"]

        # Walk extracted tree
        for root, dirs, files in os.walk(tmpdir):
            for fname in files:
                relpath = os.path.relpath(os.path.join(root, fname), tmpdir)
                if not _is_valid_resume(fname):
                    results.append({
                        "filename": relpath,
                        "status": "skipped",
                        "message": "Unsupported file type"
                    })
                    continue

                file_path = os.path.join(root, fname)
                wrapper = FileLikeAsyncWrapper(file_path, fname)

                try:
                    # Call your async parser directly
                    parsed = await resume_parser.parse_resume(wrapper)

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
                except Exception as e:
                    # include error message but avoid leaking very long traces
                    results.append({
                        "filename": relpath,
                        "status": "error",
                        "message": str(e)[:300]
                    })
                finally:
                    wrapper.close()

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
