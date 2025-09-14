import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Upload,
  FileText,
  Eye,
  Brain,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";

const UploadPage = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file) => {
    // Check if file is a PDF or DOC/DOCX
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!validTypes.includes(file.type)) {
      setUploadStatus({
        type: "error",
        message: "Please upload a PDF or Word document",
      });
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadStatus({
        type: "error",
        message: "File size must be less than 5MB",
      });
      return;
    }

    setUploadedFile(file);
    setIsUploading(true);

    // Simulate upload process
    setTimeout(() => {
      setIsUploading(false);
      setUploadStatus({
        type: "success",
        message: "Resume uploaded successfully!",
      });
    }, 2000);
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setUploadStatus(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "rgb(34, 24, 36)" }}
    >
      {/* Header */}
      <header className="pt-6 px-6">
        <div className="container mx-auto max-w-6xl flex justify-between items-center">
          <Link to="/">
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">Resume Parser</h1>
        </div>
      </header>

      <div className="container mx-auto max-w-4xl py-12 px-4">
        <div className="text-center mb-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Upload Your Resume
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Upload your resume in PDF or Word format to get started with our
            AI-powered parsing and analysis.
          </p>
        </div>

        {/* Upload Area */}
        <Card className="backdrop-blur-sm border-white/20 bg-white/5">
          <CardContent className="p-8">
            <div
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300 ${
                isDragging ? "border-white bg-white/10" : "border-white/30"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {!uploadedFile ? (
                <>
                  <div className="mb-6">
                    <Upload className="w-16 h-16 text-white/60 mx-auto" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-4">
                    Drag & Drop Your Resume
                  </h3>
                  <p className="text-white/70 mb-6">
                    PDF or Word documents, max 5MB
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    id="resume-upload"
                  />
                  <Button
                    size="lg"
                    className="bg-white text-black hover:bg-white/90 px-8 py-6 text-lg font-semibold"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Select File
                  </Button>
                </>
              ) : (
                <div className="py-4">
                  {isUploading ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
                      <p className="text-white text-lg">
                        Uploading your resume...
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
                          <p className="text-white/70 mb-6">
                            {uploadedFile.name}
                          </p>

                          {/* Action Buttons */}
                          <div className="flex flex-col sm:flex-row gap-4 mt-8">
                            <Button
                              size="lg"
                              className="bg-white text-black hover:bg-white/90 px-8 py-6 text-lg font-semibold"
                            >
                              <Eye className="w-5 h-5 mr-2" />
                              Preview Resume
                            </Button>
                            <Button
                              size="lg"
                              className="bg-sky-950 text-white hover:bg-purple-800 px-8 py-6 text-lg font-semibold"
                            >
                              <FileText className="w-5 h-5 mr-2" />
                              Parsed Result
                            </Button>
                            <Button
                              size="lg"
                              className="bg-slate-900 text-white hover:bg-teal-800 px-8 py-6 text-lg font-semibold"
                            >
                              <Brain className="w-5 h-5 mr-2" />
                              AI Insights
                            </Button>
                          </div>

                          <Button
                            variant="outline"
                            className="mt-8 border-white/20 text-zinc-900 hover:bg-white/10"
                            onClick={resetUpload}
                          >
                            Upload Another Resume
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <XCircle className="w-16 h-16 text-red-500 mb-4" />
                          <h3 className="text-2xl font-semibold text-white mb-2">
                            Upload Failed
                          </h3>
                          <p className="text-white/70 mb-6">
                            {uploadStatus?.message}
                          </p>
                          <Button
                            size="lg"
                            className="bg-white text-black hover:bg-white/90 px-8 py-6 text-lg font-semibold"
                            onClick={resetUpload}
                          >
                            Try Again
                          </Button>
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
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center">
              <Eye className="w-10 h-10 text-white mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Preview Resume
              </h3>
              <p className="text-white/70">
                View your uploaded resume in a clean, readable format.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center">
              <FileText className="w-10 h-10 text-white mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Parsed Result
              </h3>
              <p className="text-white/70">
                See structured data extracted from your resume by our advanced
                parser.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center">
              <Brain className="w-10 h-10 text-white mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                AI Insights
              </h3>
              <p className="text-white/70">
                Get intelligent recommendations to improve your resume and
                career prospects.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-white/3 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};

export default UploadPage;
