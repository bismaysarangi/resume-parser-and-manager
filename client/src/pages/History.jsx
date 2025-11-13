import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  FileText,
  Calendar,
  User,
  Mail,
  Phone,
  Trash2,
  Eye,
  Briefcase,
  GraduationCap,
  Code,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResume, setSelectedResume] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchResumeHistory();
  }, [navigate]);

  const fetchResumeHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://127.0.0.1:8000/api/resume-history",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setHistory(response.data);
    } catch (error) {
      console.error("Error fetching resume history:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteResume = async (resumeId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://127.0.0.1:8000/api/resume-history/${resumeId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setHistory(history.filter((item) => item._id !== resumeId));
    } catch (error) {
      console.error("Error deleting resume:", error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "rgb(34, 24, 36)" }}
      >
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-white">Resume History</h1>
        </div>
      </header>

      <div className="container mx-auto max-w-6xl py-8 px-4">
        {history.length === 0 ? (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-white/60 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">
                No Resume History
              </h2>
              <p className="text-white/70 mb-6">
                You haven't parsed any resumes yet.
              </p>
              <Link to="/upload">
                <Button className="bg-white text-black hover:bg-white/90">
                  Upload Your First Resume
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {history.map((item) => (
              <Card
                key={item._id}
                className="bg-white/10 backdrop-blur-sm border-white/20 hover:border-white/30 transition-all"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Resume Info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="p-3 bg-blue-500/20 rounded-lg">
                          <FileText className="w-6 h-6 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-white mb-2">
                            {item.filename}
                          </h3>
                          <div className="flex items-center gap-2 text-white/60 mb-2">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">
                              Parsed on {formatDate(item.parsed_at)}
                            </span>
                          </div>

                          {/* Quick Info */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                            {item.parsed_data.name && (
                              <div className="flex items-center gap-2 text-white/80">
                                <User className="w-4 h-4 text-green-400" />
                                <span className="text-sm">
                                  {item.parsed_data.name}
                                </span>
                              </div>
                            )}
                            {item.parsed_data.email && (
                              <div className="flex items-center gap-2 text-white/80">
                                <Mail className="w-4 h-4 text-blue-400" />
                                <span className="text-sm truncate">
                                  {item.parsed_data.email}
                                </span>
                              </div>
                            )}
                            {item.parsed_data.phone && (
                              <div className="flex items-center gap-2 text-white/80">
                                <Phone className="w-4 h-4 text-purple-400" />
                                <span className="text-sm">
                                  {item.parsed_data.phone}
                                </span>
                              </div>
                            )}
                            {item.parsed_data.experience &&
                              item.parsed_data.experience.length > 0 && (
                                <div className="flex items-center gap-2 text-white/80">
                                  <Briefcase className="w-4 h-4 text-orange-400" />
                                  <span className="text-sm">
                                    {item.parsed_data.experience.length}{" "}
                                    experiences
                                  </span>
                                </div>
                              )}
                          </div>

                          {/* Skills Preview */}
                          {item.parsed_data.skills &&
                            item.parsed_data.skills.length > 0 && (
                              <div className="mt-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <Code className="w-4 h-4 text-cyan-400" />
                                  <span className="text-white/70 text-sm font-medium">
                                    Skills
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {item.parsed_data.skills
                                    .slice(0, 5)
                                    .map((skill, index) => (
                                      <span
                                        key={index}
                                        className="px-2 py-1 bg-cyan-500/20 rounded text-cyan-300 text-xs"
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                  {item.parsed_data.skills.length > 5 && (
                                    <span className="px-2 py-1 bg-white/10 rounded text-white/60 text-xs">
                                      +{item.parsed_data.skills.length - 5} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 lg:flex-col">
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => setSelectedResume(item)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                        onClick={() => deleteResume(item._id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal for viewing resume details */}
      {selectedResume && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/20">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">
                  {selectedResume.filename}
                </h2>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedResume(null)}
                  className="text-white hover:bg-white/10"
                >
                  ✕
                </Button>
              </div>
            </div>
            <div className="p-6">
              {/* Display parsed data similar to ParsedResults.jsx */}
              <div className="space-y-6">
                {/* Personal Information */}
                {(selectedResume.parsed_data.name ||
                  selectedResume.parsed_data.email ||
                  selectedResume.parsed_data.phone) && (
                  <Card className="bg-white/10 border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <User className="w-5 h-5 mr-2" />
                        Personal Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {selectedResume.parsed_data.name && (
                        <p>
                          <strong>Name:</strong>{" "}
                          {selectedResume.parsed_data.name}
                        </p>
                      )}
                      {selectedResume.parsed_data.email && (
                        <p>
                          <strong>Email:</strong>{" "}
                          {selectedResume.parsed_data.email}
                        </p>
                      )}
                      {selectedResume.parsed_data.phone && (
                        <p>
                          <strong>Phone:</strong>{" "}
                          {selectedResume.parsed_data.phone}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Add more sections as needed */}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
