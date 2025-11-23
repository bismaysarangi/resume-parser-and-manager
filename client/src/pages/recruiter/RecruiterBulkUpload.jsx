import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import axios from "axios";
import {
  Upload,
  FileText,
  ArrowLeft,
  Loader2,
  User,
  FolderOpen,
  LogIn,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

/* RecruiterBulkUpload
   - Candidate-style upload UI (drag & drop)
   - Folder support (webkitdirectory) + drag-drop traversal for Chrome/Edge
   - Validates file types & sizes, max 100 files
   - On success: saves results to localStorage 'bulkResults' and navigates to results page
   - Shows polished success card with "View Results" and "Upload More"
*/

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 100;

const RecruiterBulkUpload = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null); // successful/failed data
  const [user, setUser] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setShowLoginPrompt(true);
      return;
    }
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/v1/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
      if (res.data.role !== "recruiter") navigate("/candidate/upload");
    } catch {
      localStorage.removeItem("token");
      setShowLoginPrompt(true);
    }
  };

  // ---- helpers to traverse dropped folders (webkitGetAsEntry fallback) ----
  const traverseFileTree = (entry, path = "") =>
    new Promise((resolve) => {
      const files = [];
      if (entry.isFile) {
        entry.file((file) => {
          file.fullPath = path + file.name;
          files.push(file);
          resolve(files);
        });
      } else if (entry.isDirectory) {
        const dirReader = entry.createReader();
        const accumulator = [];
        const readEntries = () => {
          dirReader.readEntries(async (entries) => {
            if (entries.length === 0) {
              resolve(files);
            } else {
              const promises = entries.map((ent) => traverseFileTree(ent, path + entry.name + "/"));
              const nested = await Promise.all(promises);
              nested.forEach((arr) => files.push(...arr));
              readEntries();
            }
          });
        };
        readEntries();
      } else {
        resolve(files);
      }
    });

  const gatherFilesFromDataTransfer = async (dataTransfer) => {
    const items = dataTransfer.items;
    if (!items) return [];
    // Chrome/Edge: webkitGetAsEntry available
    if (items[0] && items[0].webkitGetAsEntry) {
      const entries = [];
      for (let i = 0; i < items.length; i++) {
        const entry = items[i].webkitGetAsEntry && items[i].webkitGetAsEntry();
        if (entry) entries.push(entry);
      }
      const all = [];
      for (const entry of entries) {
        const sub = await traverseFileTree(entry, "");
        all.push(...sub);
      }
      return all;
    }
    // fallback to files
    return Array.from(dataTransfer.files || []);
  };

  // ---- drag & drop handlers ----
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = await gatherFilesFromDataTransfer(e.dataTransfer);
    processSelectedFiles(dropped);
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files || []);
    processSelectedFiles(files);
  };

  const processSelectedFiles = (files) => {
    if (!files || files.length === 0) return;
    // filter allowed types and size
    const valid = files.filter((f) => ALLOWED_TYPES.includes(f.type) && f.size <= MAX_FILE_SIZE);
    if (valid.length === 0) {
      alert("No valid resume files found (PDF/DOC/DOCX, max 5MB each).");
      return;
    }
    let final = valid.slice(0, MAX_FILES);
    if (valid.length > MAX_FILES) alert(`Only the first ${MAX_FILES} resumes will be processed.`);
    setSelectedFiles(final);
  };

  // ---- upload ----
  const handleBulkUpload = async () => {
    if (!selectedFiles.length) {
      alert("Please select/upload a folder containing resume files first.");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      setShowLoginPrompt(true);
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      const fd = new FormData();
      selectedFiles.forEach((f) => fd.append("files", f, f.name));
      const res = await axios.post("http://127.0.0.1:8000/api/recruiter/bulk-parse-resume", fd, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` },
        timeout: 120000,
      });

      // Save results, show success UI and navigate when user clicks "View Results"
      localStorage.setItem("bulkResults", JSON.stringify(res.data));
      setUploadResult(res.data);
    } catch (err) {
      console.error("Bulk upload error:", err);
      alert(err.response?.data?.detail || "Bulk upload failed. Check console.");
    } finally {
      setIsUploading(false);
    }
  };

  const reset = () => {
    setSelectedFiles([]);
    setUploadResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "rgb(34, 24, 36)" }}>
      {/* Header */}
      <header className="pt-6 px-6">
        <div className="container mx-auto max-w-6xl flex justify-between items-center">
          <Link to="/recruiter/profile">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white">Resume Parser — Recruiter</h1>
            {user && <div className="flex items-center gap-2 text-white/70"><User className="w-4 h-4" /> {user.full_name || user.username}</div>}
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl py-12 px-4">
        {/* Login prompt */}
        {showLoginPrompt && (
          <Card className="backdrop-blur-sm border-yellow-500/50 bg-yellow-500/10 mb-6">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <LogIn className="w-6 h-6 text-yellow-400" />
                <div>
                  <div className="text-yellow-400 font-semibold">Login required</div>
                  <div className="text-yellow-300/80">Please login to upload resumes.</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="border-yellow-400 text-yellow-400" onClick={() => setShowLoginPrompt(false)}>Cancel</Button>
                <Button className="bg-yellow-600 text-white" onClick={() => navigate("/login")}>Go to Login</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload card (Candidate style) */}
        <Card className="backdrop-blur-sm border-white/20 bg-white/5">
          <CardContent className="p-8">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300 ${isDragging ? "border-white bg-white/10" : "border-white/30"}`}
            >
              {!selectedFiles.length && !uploadResult ? (
                <>
                  <FolderOpen className="w-16 h-16 text-white/60 mx-auto mb-4" />
                  <h3 className="text-2xl font-semibold text-white mb-2">Drag & drop a folder or files here</h3>
                  <p className="text-white/70 mb-6">Drop a folder (Chrome/Edge) or multiple files. Up to {MAX_FILES} resumes (PDF/DOC/DOCX), 5MB each.</p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    multiple
                    webkitdirectory=""
                    directory=""
                    onChange={handleFileInput}
                  />

                  <div className="flex items-center justify-center gap-3">
                    <Button size="lg" className="bg-white text-black px-8 py-6" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="w-5 h-5 mr-2" />
                      Select Folder
                    </Button>
                    <Button variant="outline" className="border-white/20 text-white" onClick={() => reset()}>
                      Reset
                    </Button>
                  </div>
                </>
              ) : uploadResult ? (
                // SUCCESS UI (no AI insights)
                <div className="flex flex-col items-center">
                  <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
                  <h3 className="text-2xl font-semibold text-white mb-2">Upload Successful</h3>
                  <p className="text-white/70 mb-6">{selectedFiles.length} resume(s) parsed.</p>

                  <div className="grid md:grid-cols-2 gap-4 w-full max-w-2xl">
                    <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-500/20 cursor-pointer">
                      <CardContent className="p-6 text-center">
                        <h3 className="text-lg font-semibold text-white mb-2">View All Parsed Resumes</h3>
                        <p className="text-white/70 mb-4">Open the parsed results page to review each candidate.</p>
                        <Button className="bg-blue-600 text-white w-full" onClick={() => navigate("/recruiter/bulk-results")}>
                          View Results
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                      <CardContent className="p-6 text-center">
                        <h3 className="text-lg font-semibold text-white mb-2">Upload More</h3>
                        <p className="text-white/70 mb-4">Start a new bulk upload session.</p>
                        <Button variant="outline" className="border-white/20 text-white w-full" onClick={() => { reset(); localStorage.removeItem("bulkResults"); }}>
                          Upload More
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                // files selected, ready to upload
                <>
                  <div className="flex flex-col items-center">
                    <FileText className="w-12 h-12 text-white/60 mb-3" />
                    <h3 className="text-2xl font-semibold text-white mb-1">{selectedFiles.length} resume(s) ready</h3>
                    <p className="text-white/70 mb-4">Ready to upload and parse. Click below to start.</p>
                    <div className="flex gap-4">
                      <Button size="lg" className="bg-green-600 text-white px-8 py-6" onClick={handleBulkUpload} disabled={isUploading}>
                        {isUploading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <Upload className="w-5 h-5 mr-2" />}
                        {isUploading ? "Parsing..." : "Upload & Parse All"}
                      </Button>
                      <Button size="lg" variant="outline" className="border-white/20 text-white" onClick={() => reset()}>
                        Reset
                      </Button>
                    </div>

                    <div className="mt-6 w-full max-w-2xl">
                      <div className="text-white/70 text-sm">Selected files preview:</div>
                      <div className="mt-3 max-h-48 overflow-auto bg-white/5 rounded p-3">
                        <ul className="text-white text-sm space-y-1">
                          {selectedFiles.map((f, i) => (
                            <li key={i} className="flex justify-between">
                              <span className="truncate max-w-[70%]">{f.name}</span>
                              <span className="text-white/60 text-xs">{Math.round(f.size / 1024)} KB</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Info cards */}
        <div className="grid md:grid-cols-2 gap-6 mt-10">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center">
              <FileText className="w-10 h-10 text-white mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Parsed Result Viewer</h3>
              <p className="text-white/70">After parsing you'll be taken to a paginated, expandable results viewer styled like candidate pages.</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-10 h-10 text-white mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Recruiter Workflow</h3>
              <p className="text-white/70">Upload folder → review parsed candidates → take action from results.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default RecruiterBulkUpload;
