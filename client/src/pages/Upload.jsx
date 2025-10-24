import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import axios from "axios";
import {
  Upload,
  FileText,
  Brain,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const UploadPage = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

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
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file) => {
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
    setUploadStatus(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        "http://localhost:8000/api/parse-resume",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setResult(response.data);
      setIsUploading(false);
      setUploadStatus({
        type: "success",
        message: "Resume uploaded successfully!",
      });
    } catch (error) {
      console.error("Error uploading the file:", error);
      setIsUploading(false);
      setUploadStatus({
        type: "error",
        message: "Failed to upload resume. Please try again.",
      });
    }
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setUploadStatus(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleNavigateToParsed = () => {
    if (result) {
      navigate("/parsed-results", {
        state: { parsedData: result, fileName: uploadedFile.name },
      });
    }
  };

  const handleNavigateToInsights = () => {
    if (result) {
      navigate("/ai-insights", {
        state: { parsedData: result, fileName: uploadedFile.name },
      });
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
                        Uploading and parsing your resume...
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

                          {/* Navigation Cards */}
                          <div className="grid md:grid-cols-2 gap-6 w-full max-w-2xl mt-8">
                            <Card
                              className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border-blue-500/30 cursor-pointer hover:border-blue-400/50 transition-all duration-300 hover:scale-105"
                              onClick={handleNavigateToParsed}
                            >
                              <CardContent className="p-8 text-center">
                                <FileText className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                                <h3 className="text-2xl font-semibold text-white mb-2">
                                  Parsed Resume
                                </h3>
                                <p className="text-white/70 mb-6">
                                  View structured data extracted from your
                                  resume
                                </p>
                                <Button
                                  className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                                  onClick={handleNavigateToParsed}
                                >
                                  View Results
                                  <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                              </CardContent>
                            </Card>

                            <Card
                              className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 border-purple-500/30 cursor-pointer hover:border-purple-400/50 transition-all duration-300 hover:scale-105"
                              onClick={handleNavigateToInsights}
                            >
                              <CardContent className="p-8 text-center">
                                <Brain className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                                <h3 className="text-2xl font-semibold text-white mb-2">
                                  AI Insights
                                </h3>
                                <p className="text-white/70 mb-6">
                                  Get intelligent recommendations and analysis
                                </p>
                                <Button
                                  className="bg-purple-600 hover:bg-purple-700 text-white w-full"
                                  onClick={handleNavigateToInsights}
                                >
                                  Get Insights
                                  <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                              </CardContent>
                            </Card>
                          </div>

                          <Button
                            variant="outline"
                            className="mt-8 border-white/20 text-black hover:bg-white/10"
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
        <div className="grid md:grid-cols-2 gap-6 mt-16">
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
    </div>
  );
};

export default UploadPage;
