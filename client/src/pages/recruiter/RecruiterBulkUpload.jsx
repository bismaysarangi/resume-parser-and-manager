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
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

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
  const [uploadStatus, setUploadStatus] = useState(null);
  const [result, setResult] = useState(null);
  const [user, setUser] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [fileWarning, setFileWarning] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem("token");
    console.log("Current token:", token);

    if (token) {
      try {
        const response = await axios.get(
          "http://127.0.0.1:8000/api/v1/user/profile",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setUser(response.data);
        console.log("User is authenticated:", response.data);

        // Redirect if not recruiter
        if (response.data.role !== "recruiter") {
          navigate("/candidate/upload");
        }
      } catch (error) {
        console.error("Token invalid or expired:", error);
        localStorage.removeItem("token");
        setShowLoginPrompt(true);
      }
    } else {
      setShowLoginPrompt(true);
    }
  };

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
    const files = await gatherFilesFromDataTransfer(e.dataTransfer);
    if (files.length > 0) {
      processSelectedFiles(files);
    }
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files || []);
    processSelectedFiles(files);
  };

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
        const readEntries = () => {
          dirReader.readEntries(async (entries) => {
            if (entries.length === 0) {
              resolve(files);
            } else {
              const promises = entries.map((ent) =>
                traverseFileTree(ent, path + entry.name + "/")
              );
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
    if (!items) return Array.from(dataTransfer.files || []);

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
    return Array.from(dataTransfer.files || []);
  };

  const processSelectedFiles = (files) => {
    if (!files || files.length === 0) return;

    const valid = files.filter(
      (f) => ALLOWED_TYPES.includes(f.type) && f.size <= MAX_FILE_SIZE
    );
    if (valid.length === 0) {
      setUploadStatus({
        type: "error",
        message: "No valid resume files found (PDF/DOC/DOCX, max 5MB each).",
      });
      return;
    }

    let final = valid.slice(0, MAX_FILES);

    // Show warning instead of alert if files exceed limit
    if (valid.length > MAX_FILES) {
      setFileWarning(
        `You selected ${valid.length} files. Only the first ${MAX_FILES} resumes will be processed.`
      );
    } else {
      setFileWarning(null);
    }

    setSelectedFiles(final);
    setUploadStatus(null);
    setResult(null);
  };

  const handleBulkUpload = async () => {
    if (selectedFiles.length === 0) {
      setUploadStatus({
        type: "error",
        message: "Please select files first.",
      });
      return;
    }

    const token = localStorage.getItem("token");
    console.log("Upload - Token from localStorage:", token);

    if (!token) {
      setShowLoginPrompt(true);
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);
    setShowLoginPrompt(false);
    setFileWarning(null);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) =>
        formData.append("files", file, file.name)
      );

      console.log("Sending bulk upload request with token:", token);

      const response = await axios.post(
        "http://127.0.0.1:8000/api/recruiter/bulk-parse-resume",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
          timeout: 120000,
        }
      );

      console.log("Bulk upload successful:", response.data);
      setResult(response.data);
      setIsUploading(false);
      setUploadStatus({
        type: "success",
        message: `${response.data.summary.successful} resume(s) uploaded successfully!`,
      });

      // Save results to localStorage for the results page
      localStorage.setItem("bulkResults", JSON.stringify(response.data));
    } catch (error) {
      console.error("Error uploading files:", error);
      console.error("Error response:", error.response?.data);
      setIsUploading(false);

      if (error.response && error.response.status === 401) {
        setUploadStatus({
          type: "error",
          message: "Session expired. Please login again.",
        });
        localStorage.removeItem("token");
        setShowLoginPrompt(true);
      } else {
        setUploadStatus({
          type: "error",
          message: "Failed to upload resumes. Please try again.",
        });
      }
    }
  };

  const resetUpload = () => {
    setSelectedFiles([]);
    setUploadStatus(null);
    setResult(null);
    setShowLoginPrompt(false);
    setFileWarning(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleNavigateToResults = () => {
    if (result) {
      navigate("/recruiter/bulk-results", {
        state: result,
      });
    }
  };

  const handleLoginRedirect = () => {
    navigate("/login");
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "rgb(34, 24, 36)" }}
    >
      {/* Header */}
      <header className="pt-6 px-6">
        <div className="container mx-auto max-w-6xl flex justify-between items-center">
          <Link to="/recruiter/profile">
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white">
              Bulk Resume Parser
            </h1>
            {user && (
              <div className="flex items-center gap-2 text-white/70">
                <User className="w-4 h-4" />
                <span>Welcome, {user.full_name || user.username}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-4xl py-12 px-4">
        <div className="text-center mb-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Upload Multiple Resumes
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Upload multiple resumes in PDF or Word format to parse them all at
            once. Perfect for processing candidate batches.
          </p>
        </div>

        {/* Login Prompt */}
        {showLoginPrompt && (
          <Card className="backdrop-blur-sm border-yellow-500/50 bg-yellow-500/10 mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <LogIn className="w-6 h-6 text-yellow-400 mr-3" />
                  <div>
                    <h3 className="text-yellow-400 font-semibold text-lg">
                      Login Required
                    </h3>
                    <p className="text-yellow-300/80">
                      Please log in to upload and analyze resumes.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="border-yellow-400 text-yellow-400 hover:bg-yellow-400/20"
                    onClick={() => setShowLoginPrompt(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    onClick={handleLoginRedirect}
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Go to Login
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* File Warning */}
        {fileWarning && (
          <Card className="backdrop-blur-sm border-orange-500/50 bg-orange-500/10 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-orange-400 mr-3 flex-shrink-0" />
                <p className="text-orange-300">{fileWarning}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Area */}
        <Card className="backdrop-blur-sm border-white/20 bg-white/5">
          <CardContent className="p-8">
            <div
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300 ${
                isDragging ? "border-white bg-white/10" : "border-white/30"
              } ${showLoginPrompt ? "opacity-50" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {selectedFiles.length === 0 ? (
                <>
                  <div className="mb-6">
                    <FolderOpen className="w-16 h-16 text-white/60 mx-auto" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-4">
                    Drag & Drop Resumes or Folder
                  </h3>
                  <p className="text-white/70 mb-6">
                    PDF or Word documents, max 5MB each, up to {MAX_FILES} files
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileInput}
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    id="bulk-resume-upload"
                    multiple
                    webkitdirectory=""
                    directory=""
                  />
                  <Button
                    size="lg"
                    className="bg-white text-black hover:bg-white/90 px-8 py-6 text-lg font-semibold"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={showLoginPrompt}
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Select Files/Folder
                  </Button>

                  {/* User status info */}
                  <div className="mt-4">
                    {user ? (
                      <p className="text-green-400 text-sm">
                        ✓ Logged in as {user.email}
                      </p>
                    ) : (
                      <p className="text-yellow-400 text-sm">
                        You need to be logged in to upload resumes
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-4">
                  {isUploading ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
                      <p className="text-white text-lg">
                        Uploading and parsing {selectedFiles.length} resumes...
                      </p>
                    </div>
                  ) : (
                    <>
                      {uploadStatus?.type === "success" ? (
                        <div className="flex flex-col items-center">
                          <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                          <h3 className="text-2xl font-semibold text-white mb-2">
                            Upload Successful!
                          </h3>
                          <p className="text-white/70 mb-2">
                            {result?.summary?.successful || 0} resume(s)
                            processed successfully
                          </p>
                          {result?.summary?.duplicates > 0 && (
                            <p className="text-orange-400 text-sm mb-2">
                              {result.summary.duplicates} duplicate(s) skipped
                            </p>
                          )}
                          {result?.summary?.failed > 0 && (
                            <p className="text-red-400 text-sm mb-6">
                              {result.summary.failed} failed to parse
                            </p>
                          )}

                          {/* Navigation Card */}
                          <div className="w-full max-w-md mt-8">
                            <Card
                              className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border-blue-500/30 cursor-pointer hover:border-blue-400/50 transition-all duration-300 hover:scale-105"
                              onClick={handleNavigateToResults}
                            >
                              <CardContent className="p-8 text-center">
                                <FileText className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                                <h3 className="text-2xl font-semibold text-white mb-2">
                                  View Parsed Results
                                </h3>
                                <p className="text-white/70 mb-6">
                                  Review all parsed candidate data in a
                                  structured format
                                </p>
                                <Button
                                  className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                                  onClick={handleNavigateToResults}
                                >
                                  View Results
                                  <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                              </CardContent>
                            </Card>
                          </div>

                          <Button
                            variant="outline"
                            className="bg-white text-black hover:bg-white/90 px-7 py-5 text-lg font-semibold mt-6"
                            onClick={resetUpload}
                          >
                            Upload More Resumes
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          {uploadStatus?.type === "error" ? (
                            <>
                              <XCircle className="w-16 h-16 text-red-500 mb-4" />
                              <h3 className="text-2xl font-semibold text-white mb-2">
                                Upload Failed
                              </h3>
                              <p className="text-white/70 mb-6">
                                {uploadStatus?.message}
                              </p>
                            </>
                          ) : (
                            <>
                              <FileText className="w-16 h-16 text-white/60 mb-4" />
                              <h3 className="text-2xl font-semibold text-white mb-2">
                                {selectedFiles.length} Resume(s) Ready
                              </h3>
                              <p className="text-white/70 mb-6">
                                Ready to upload and parse
                              </p>
                            </>
                          )}

                          <div className="flex gap-4 mb-6">
                            <Button
                              size="lg"
                              className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg font-semibold"
                              onClick={handleBulkUpload}
                              disabled={isUploading || showLoginPrompt}
                            >
                              {isUploading ? (
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              ) : (
                                <Upload className="w-5 h-5 mr-2" />
                              )}
                              {isUploading
                                ? "Processing..."
                                : `Upload ${selectedFiles.length} Resume(s)`}
                            </Button>
                            <Button
                              size="lg"
                              variant="outline"
                              className="bg-white text-black hover:bg-white/90 px-8 py-6 text-lg font-semibold"
                              onClick={resetUpload}
                            >
                              Reset Selection
                            </Button>
                          </div>

                          {/* Files preview */}
                          <div className="w-full max-w-2xl mt-4">
                            <div className="text-white/70 text-sm mb-2">
                              Selected files:
                            </div>
                            <div className="max-h-48 overflow-auto bg-white/5 rounded-lg p-4">
                              <ul className="text-white text-sm space-y-2">
                                {selectedFiles.map((file, index) => (
                                  <li
                                    key={index}
                                    className="flex justify-between items-center"
                                  >
                                    <span className="truncate flex-1">
                                      {file.name}
                                    </span>
                                    <span className="text-white/60 text-xs ml-2">
                                      {Math.round(file.size / 1024)} KB
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Features reminder */}
        <div className="grid md:grid-cols-2 gap-6 mt-16">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center">
              <FileText className="w-10 h-10 text-white mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Bulk Processing
              </h3>
              <p className="text-white/70">
                Upload and parse multiple resumes simultaneously to save time on
                candidate screening.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center">
              <FolderOpen className="w-10 h-10 text-white mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Folder Support
              </h3>
              <p className="text-white/70">
                Drag and drop entire folders of resumes for batch processing
                (Chrome/Edge).
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RecruiterBulkUpload;
