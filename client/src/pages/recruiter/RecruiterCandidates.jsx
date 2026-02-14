import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Briefcase,
  Code,
  Award,
  Calendar,
  Building2,
  Search,
  Eye,
  Trash2,
  Users,
  Sparkles,
  X,
  MessageCircle,
  Trophy,
  Heart,
  Languages,
  BookOpen,
  FileCheck,
  FileText,
  Plus,
  ExternalLink,
  Linkedin,
  Github,
  Globe,
  MapPin,
  Home,
  Flag,
  UserCircle,
  Cake,
  Target,
  LinkIcon,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:8000";

// Helper function to get value regardless of case
const getValue = (obj, key) => {
  if (!obj) return null;
  // Try exact match first
  if (obj[key] !== undefined) return obj[key];
  // Try lowercase
  const lowerKey = key.toLowerCase();
  if (obj[lowerKey] !== undefined) return obj[lowerKey];
  // Try capitalized
  const capitalizedKey =
    key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
  if (obj[capitalizedKey] !== undefined) return obj[capitalizedKey];
  return null;
};

// Helper functions
const hasValidItems = (array) => {
  if (!array || !Array.isArray(array) || array.length === 0) return false;
  return array.some((item) => {
    if (!item || typeof item !== "object") return false;
    return Object.values(item).some(
      (value) =>
        value !== null &&
        value !== undefined &&
        value !== "" &&
        value !== "null" &&
        !(Array.isArray(value) && value.length === 0),
    );
  });
};

const hasValidSkills = (skills) => {
  return (
    skills &&
    Array.isArray(skills) &&
    skills.length > 0 &&
    skills.some(
      (skill) =>
        skill &&
        typeof skill === "string" &&
        skill.trim() !== "" &&
        skill.trim() !== "null",
    )
  );
};

const hasValidLanguages = (languages) => {
  if (!languages || !Array.isArray(languages) || languages.length === 0)
    return false;
  return languages.some((lang) => {
    const language = getValue(lang, "Language");
    return language && language.trim() !== "" && language.trim() !== "null";
  });
};

const RecruiterCandidates = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch candidates on mount
  useEffect(() => {
    fetchCandidates();
  }, []);

  // Filter candidates based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCandidates(candidates);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = candidates.filter((candidate) => {
      const data = candidate.parsed_data || {};
      const name = (data.name || "").toLowerCase();
      const email = (data.email || "").toLowerCase();
      const skills = (data.skills || []).join(" ").toLowerCase();
      const derivedSkills = (data.derived_skills || []).join(" ").toLowerCase();

      return (
        name.includes(query) ||
        email.includes(query) ||
        skills.includes(query) ||
        derivedSkills.includes(query)
      );
    });

    setFilteredCandidates(filtered);
  }, [searchQuery, candidates]);

  const fetchCandidates = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/recruiter/candidates`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch candidates");
      }

      const data = await response.json();

      // Deduplication logic
      const uniqueCandidates = [];
      const seenEmails = new Set();
      const seenPhones = new Set();
      const seenNames = new Set();
      const seenIds = new Set();

      data.forEach((candidate) => {
        const parsed = candidate.parsed_data || {};
        const id = candidate._id;

        const email = parsed.email ? parsed.email.trim().toLowerCase() : null;
        let phone = parsed.phone
          ? parsed.phone.toString().replace(/\D/g, "")
          : null;
        if (phone && phone.length < 6) phone = null;
        const name = parsed.name ? parsed.name.trim().toLowerCase() : null;

        let isDuplicate = false;

        if (seenIds.has(id)) {
          isDuplicate = true;
        }

        if (!isDuplicate && email && email !== "no email") {
          if (seenEmails.has(email)) {
            isDuplicate = true;
          } else {
            seenEmails.add(email);
          }
        }

        if (!isDuplicate && phone) {
          if (seenPhones.has(phone)) {
            isDuplicate = true;
          } else {
            seenPhones.add(phone);
          }
        }

        if (!isDuplicate && name && name !== "unknown candidate") {
          if (seenNames.has(name)) {
            isDuplicate = true;
          } else {
            seenNames.add(name);
          }
        }

        if (!isDuplicate) {
          seenIds.add(id);
          uniqueCandidates.push(candidate);
        }
      });

      setCandidates(uniqueCandidates);
      setFilteredCandidates(uniqueCandidates);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const viewCandidateDetails = async (resumeId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/api/recruiter/candidates/${resumeId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch candidate details");
      }

      const data = await response.json();
      setSelectedCandidate(data);
      setShowDetailModal(true);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeleteClick = (e, candidate) => {
    e.stopPropagation();
    const name = candidate.parsed_data?.name || "Unknown Candidate";
    setDeleteConfirm({ id: candidate._id, name });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/api/recruiter/candidates/${deleteConfirm.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to delete resume");
      }

      // Remove from local state
      setCandidates((prev) => prev.filter((c) => c._id !== deleteConfirm.id));
      setFilteredCandidates((prev) =>
        prev.filter((c) => c._id !== deleteConfirm.id),
      );

      // Close modal if this candidate was being viewed
      if (selectedCandidate?._id === deleteConfirm.id) {
        setShowDetailModal(false);
        setSelectedCandidate(null);
      }

      setDeleteConfirm(null);
    } catch (err) {
      alert(`Error deleting resume: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "rgb(34, 24, 36)" }}
      >
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Loading Candidates...
            </h2>
            <p className="text-white/70">Please wait</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "rgb(34, 24, 36)" }}
      >
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 text-red-400 mx-auto mb-4 flex items-center justify-center">
              <X className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
            <p className="text-white/70 mb-6">{error}</p>
            <Button
              className="bg-white text-black hover:bg-white/90"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pt-16"
      style={{ backgroundColor: "rgb(34, 24, 36)" }}
    >
      <div className="container mx-auto max-w-7xl py-6 sm:py-8 px-4 sm:px-6 mt-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Users className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">My Candidates</h1>
                <p className="text-white/60 text-sm mt-1">
                  {filteredCandidates.length} candidate
                  {filteredCandidates.length !== 1 ? "s" : ""} found
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
                onClick={() => navigate("/recruiter/chatbot")}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chatbot
              </Button>
              <Button
                className="bg-blue-500 text-white hover:bg-blue-600"
                onClick={() => navigate("/recruiter/bulk-upload")}
              >
                Upload More
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
            <Input
              type="text"
              placeholder="Search by name, email, or skills..."
              className="w-full pl-12 pr-4 py-6 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400 focus:ring-blue-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Candidates Grid */}
        {filteredCandidates.length === 0 ? (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-white/40 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                No Candidates Found
              </h3>
              <p className="text-white/60 mb-6">
                {searchQuery
                  ? "Try adjusting your search criteria"
                  : "Upload resumes to start building your candidate database"}
              </p>
              {!searchQuery && (
                <Button
                  className="bg-white text-black hover:bg-white/90"
                  onClick={() => navigate("/recruiter/bulk-upload")}
                >
                  Upload Resumes
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCandidates.map((candidate) => {
              const data = candidate.parsed_data || {};
              const name = data.name || "Unknown Candidate";
              const email = data.email || "No email";
              const phone = data.phone || "No phone";
              const skills = data.skills || [];
              const derivedSkills = data.derived_skills || [];
              const experience = data.experience || [];
              const education = data.education || [];

              return (
                <Card
                  key={candidate._id}
                  className="bg-white/10 backdrop-blur-sm border-white/20 hover:border-white/40 transition-all cursor-pointer group relative"
                  onClick={() => viewCandidateDetails(candidate._id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
                          <User className="w-6 h-6 text-blue-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-white text-lg font-semibold truncate">
                            {name}
                          </CardTitle>
                          <p className="text-white/60 text-sm truncate">
                            {candidate.filename}
                          </p>
                        </div>
                      </div>
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Eye className="w-5 h-5 text-white/40 group-hover:text-white/80 transition-colors" />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 h-8 w-8"
                          onClick={(e) => handleDeleteClick(e, candidate)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Contact Info */}
                    <div className="space-y-2">
                      {email && email !== "No email" && (
                        <div className="flex items-center gap-2 text-white/70 text-sm">
                          <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
                          <span className="truncate">{email}</span>
                        </div>
                      )}
                      {phone && phone !== "No phone" && (
                        <div className="flex items-center gap-2 text-white/70 text-sm">
                          <Phone className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <span>{phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Quick Stats */}
                    <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                      {experience.length > 0 && (
                        <div className="flex items-center gap-1 text-white/60 text-xs">
                          <Briefcase className="w-3.5 h-3.5 text-green-400" />
                          <span>{experience.length} exp</span>
                        </div>
                      )}
                      {education.length > 0 && (
                        <div className="flex items-center gap-1 text-white/60 text-xs">
                          <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{education.length} edu</span>
                        </div>
                      )}
                      {(skills.length > 0 || derivedSkills.length > 0) && (
                        <div className="flex items-center gap-1 text-white/60 text-xs">
                          <Code className="w-3.5 h-3.5 text-orange-400" />
                          <span>
                            {skills.length + derivedSkills.length} skills
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Top Skills Preview */}
                    {(skills.length > 0 || derivedSkills.length > 0) && (
                      <div className="pt-2">
                        <div className="flex flex-wrap gap-1.5">
                          {[...skills.slice(0, 3), ...derivedSkills.slice(0, 2)]
                            .slice(0, 3)
                            .map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-white/10 rounded text-white/80 text-xs truncate"
                              >
                                {skill}
                              </span>
                            ))}
                          {skills.length + derivedSkills.length > 3 && (
                            <span className="px-2 py-1 bg-white/5 rounded text-white/60 text-xs">
                              +{skills.length + derivedSkills.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Upload Date */}
                    <div className="flex items-center gap-2 text-white/50 text-xs pt-2 border-t border-white/10">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        Uploaded{" "}
                        {new Date(candidate.parsed_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={cancelDelete}
        >
          <Card
            className="bg-gradient-to-br from-red-900/90 to-gray-900/90 border-red-500/30 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="border-b border-red-500/20">
              <CardTitle className="flex items-center text-white text-xl">
                <AlertTriangle className="w-6 h-6 text-red-400 mr-3" />
                Confirm Deletion
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <p className="text-white/90">
                Are you sure you want to delete the resume for{" "}
                <span className="font-semibold text-white">
                  {deleteConfirm.name}
                </span>
                ?
              </p>
              <p className="text-white/70 text-sm">
                This action cannot be undone. The resume will be permanently
                removed from your database.
              </p>
              <div className="flex gap-3 pt-4">
                <Button
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                  onClick={confirmDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </>
                  )}
                </Button>
                <Button
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/20"
                  onClick={cancelDelete}
                  disabled={deleting}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detail Modal - keeping the existing detailed view modal code here */}
      {showDetailModal && selectedCandidate && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowDetailModal(false)}
        >
          <Card
            className="bg-gradient-to-br from-gray-900 to-gray-800 border-white/20 max-w-4xl w-full my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="border-b border-white/10">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-white text-2xl">
                  <div className="p-2 bg-blue-500/20 rounded-lg mr-3">
                    <User className="w-6 h-6 text-blue-400" />
                  </div>
                  {selectedCandidate.parsed_data?.name || "Unknown Candidate"}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(e, selectedCandidate);
                    }}
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white/60 hover:text-white hover:bg-white/10"
                    onClick={() => setShowDetailModal(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 mt-6 max-h-[70vh] overflow-y-auto">
              {(() => {
                const data = selectedCandidate.parsed_data || {};
                const regularSkills = data.skills || [];
                const derivedSkills = data.derived_skills || [];

                return (
                  <>
                    {/* Personal Information */}
                    {(data.name ||
                      data.email ||
                      data.phone ||
                      data.gender ||
                      data.date_of_birth ||
                      data.age ||
                      data.nationality ||
                      data.marital_status) && (
                      <Card className="bg-gradient-to-br from-blue-600/10 to-cyan-600/5 border-blue-500/20">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg">
                            <User className="w-5 h-5 text-blue-400 mr-2" />
                            Personal Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {data.name && (
                              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                                <User className="w-5 h-5 text-blue-400 mt-0.5" />
                                <div>
                                  <p className="text-white/60 text-sm mb-1">
                                    Full Name
                                  </p>
                                  <p className="text-white font-medium">
                                    {data.name}
                                  </p>
                                </div>
                              </div>
                            )}
                            {data.email && (
                              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                                <Mail className="w-5 h-5 text-blue-400 mt-0.5" />
                                <div>
                                  <p className="text-white/60 text-sm mb-1">
                                    Email
                                  </p>
                                  <p className="text-white font-medium break-all">
                                    {data.email}
                                  </p>
                                </div>
                              </div>
                            )}
                            {data.phone && (
                              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                                <Phone className="w-5 h-5 text-blue-400 mt-0.5" />
                                <div>
                                  <p className="text-white/60 text-sm mb-1">
                                    Phone
                                  </p>
                                  <p className="text-white font-medium">
                                    {data.phone}
                                  </p>
                                </div>
                              </div>
                            )}
                            {data.gender && (
                              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                                <UserCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                                <div>
                                  <p className="text-white/60 text-sm mb-1">
                                    Gender
                                  </p>
                                  <p className="text-white font-medium">
                                    {data.gender}
                                  </p>
                                </div>
                              </div>
                            )}
                            {data.date_of_birth && (
                              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                                <Cake className="w-5 h-5 text-blue-400 mt-0.5" />
                                <div>
                                  <p className="text-white/60 text-sm mb-1">
                                    Date of Birth
                                  </p>
                                  <p className="text-white font-medium">
                                    {data.date_of_birth}
                                  </p>
                                </div>
                              </div>
                            )}
                            {data.age && (
                              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                                <Calendar className="w-5 h-5 text-blue-400 mt-0.5" />
                                <div>
                                  <p className="text-white/60 text-sm mb-1">
                                    Age
                                  </p>
                                  <p className="text-white font-medium">
                                    {data.age} years
                                  </p>
                                </div>
                              </div>
                            )}
                            {data.nationality && (
                              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                                <Flag className="w-5 h-5 text-blue-400 mt-0.5" />
                                <div>
                                  <p className="text-white/60 text-sm mb-1">
                                    Nationality
                                  </p>
                                  <p className="text-white font-medium">
                                    {data.nationality}
                                  </p>
                                </div>
                              </div>
                            )}
                            {data.marital_status && (
                              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                                <Heart className="w-5 h-5 text-blue-400 mt-0.5" />
                                <div>
                                  <p className="text-white/60 text-sm mb-1">
                                    Marital Status
                                  </p>
                                  <p className="text-white font-medium">
                                    {data.marital_status}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Location Information */}
                    {(data.current_location ||
                      data.permanent_address ||
                      data.hometown) && (
                      <Card className="bg-gradient-to-br from-emerald-600/10 to-teal-600/5 border-emerald-500/20">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg">
                            <MapPin className="w-5 h-5 text-emerald-400 mr-2" />
                            Location Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {data.current_location && (
                              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                                <MapPin className="w-5 h-5 text-emerald-400 mt-0.5" />
                                <div>
                                  <p className="text-white/60 text-sm mb-1">
                                    Current Location
                                  </p>
                                  <p className="text-white font-medium">
                                    {data.current_location}
                                  </p>
                                </div>
                              </div>
                            )}
                            {data.permanent_address && (
                              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                                <Home className="w-5 h-5 text-emerald-400 mt-0.5" />
                                <div>
                                  <p className="text-white/60 text-sm mb-1">
                                    Permanent Address
                                  </p>
                                  <p className="text-white font-medium">
                                    {data.permanent_address}
                                  </p>
                                </div>
                              </div>
                            )}
                            {data.hometown && (
                              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                                <Home className="w-5 h-5 text-emerald-400 mt-0.5" />
                                <div>
                                  <p className="text-white/60 text-sm mb-1">
                                    Hometown
                                  </p>
                                  <p className="text-white font-medium">
                                    {data.hometown}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Summary/Objective */}
                    {(data.summary ||
                      data.objective ||
                      data.career_objective) && (
                      <Card className="bg-gradient-to-br from-sky-600/10 to-blue-600/5 border-sky-500/20">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg">
                            <Target className="w-5 h-5 text-sky-400 mr-2" />
                            Professional Summary
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {data.summary && (
                            <div className="p-4 bg-white/5 rounded-lg">
                              <h4 className="text-white/80 text-sm font-semibold mb-2">
                                Summary
                              </h4>
                              <p className="text-white/70 text-sm leading-relaxed">
                                {data.summary}
                              </p>
                            </div>
                          )}
                          {data.objective && (
                            <div className="p-4 bg-white/5 rounded-lg">
                              <h4 className="text-white/80 text-sm font-semibold mb-2">
                                Objective
                              </h4>
                              <p className="text-white/70 text-sm leading-relaxed">
                                {data.objective}
                              </p>
                            </div>
                          )}
                          {data.career_objective && (
                            <div className="p-4 bg-white/5 rounded-lg">
                              <h4 className="text-white/80 text-sm font-semibold mb-2">
                                Career Objective
                              </h4>
                              <p className="text-white/70 text-sm leading-relaxed">
                                {data.career_objective}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Education */}
                    {hasValidItems(data.education) && (
                      <Card className="bg-white/10 border-white/20">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg">
                            <GraduationCap className="w-5 h-5 text-indigo-400 mr-2" />
                            Education ({data.education.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {data.education.map((edu, idx) => {
                              const degree = getValue(edu, "Degree");
                              const university = getValue(edu, "University");
                              const grade = getValue(edu, "Grade");
                              const years = getValue(edu, "Years");

                              return (
                                <div
                                  key={idx}
                                  className="p-4 bg-gradient-to-br from-indigo-500/5 to-blue-500/5 rounded-lg border border-indigo-500/10"
                                >
                                  {degree && (
                                    <h4 className="text-white font-semibold text-base mb-1">
                                      {degree}
                                    </h4>
                                  )}
                                  {university && (
                                    <p className="text-white/80 text-sm mb-2">
                                      {university}
                                    </p>
                                  )}
                                  <div className="flex flex-wrap gap-4 mt-2">
                                    {grade && (
                                      <span className="text-white/70 text-sm">
                                        Grade: {grade}
                                      </span>
                                    )}
                                    {years && (
                                      <span className="text-white/70 text-sm">
                                        Years: {years}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Experience */}
                    {hasValidItems(data.experience) && (
                      <Card className="bg-white/10 border-white/20">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg">
                            <Briefcase className="w-5 h-5 text-green-400 mr-2" />
                            Work Experience ({data.experience.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {data.experience.map((exp, idx) => {
                              const role = getValue(exp, "Role");
                              const company = getValue(exp, "Company");
                              const description = getValue(exp, "Description");
                              const years = getValue(exp, "Years");

                              return (
                                <div
                                  key={idx}
                                  className="p-4 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-lg border border-green-500/10"
                                >
                                  {role && (
                                    <h4 className="text-white font-semibold text-base mb-1">
                                      {role}
                                    </h4>
                                  )}
                                  {company && (
                                    <div className="flex items-center gap-2 text-white/80 mb-2">
                                      <Building2 className="w-4 h-4 text-green-400" />
                                      <span className="text-sm">{company}</span>
                                    </div>
                                  )}
                                  {description && (
                                    <p className="text-white/70 text-sm mt-2 leading-relaxed">
                                      {description}
                                    </p>
                                  )}
                                  {years && (
                                    <div className="flex items-center gap-2 text-white/60 bg-green-500/10 px-3 py-1 rounded-full w-fit mt-2">
                                      <Calendar className="w-4 h-4 text-green-400" />
                                      <span className="text-sm">{years}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Skills */}
                    {(hasValidSkills(regularSkills) ||
                      hasValidSkills(derivedSkills)) && (
                      <Card className="bg-white/10 border-white/20">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg">
                            <Code className="w-5 h-5 text-orange-400 mr-2" />
                            Skills & Technologies (
                            {regularSkills.length + derivedSkills.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {hasValidSkills(regularSkills) && (
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <Code className="w-4 h-4 text-orange-400" />
                                <h4 className="text-white/90 text-sm font-semibold">
                                  Listed Skills ({regularSkills.length})
                                </h4>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {regularSkills.map((skill, idx) => (
                                  <span
                                    key={idx}
                                    className="px-4 py-2 bg-gradient-to-r from-orange-600/20 to-red-600/20 border border-orange-500/30 rounded-full text-white text-sm font-medium"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {hasValidSkills(derivedSkills) && (
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="w-4 h-4 text-cyan-400" />
                                <h4 className="text-white/90 text-sm font-semibold">
                                  Derived from Projects & Experience (
                                  {derivedSkills.length})
                                </h4>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {derivedSkills.map((skill, idx) => (
                                  <span
                                    key={idx}
                                    className="px-4 py-2 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 rounded-full text-cyan-200 text-sm font-medium"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Projects */}
                    {hasValidItems(data.projects) && (
                      <Card className="bg-white/10 border-white/20">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg">
                            <Award className="w-5 h-5 text-cyan-400 mr-2" />
                            Projects ({data.projects.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {data.projects.map((project, idx) => {
                              const title =
                                getValue(project, "Title") ||
                                getValue(project, "Name");
                              const description =
                                getValue(project, "Description") ||
                                getValue(project, "Supervisor");
                              const duration =
                                getValue(project, "Duration") ||
                                getValue(project, "Date");
                              const techStack =
                                getValue(project, "Tech Stack") ||
                                getValue(project, "Technologies");

                              return (
                                <div
                                  key={idx}
                                  className="p-4 bg-gradient-to-br from-cyan-500/5 to-teal-500/5 rounded-lg border border-cyan-500/10"
                                >
                                  {title && (
                                    <h4 className="text-white font-semibold text-base mb-2">
                                      {title}
                                    </h4>
                                  )}
                                  {description && (
                                    <p className="text-white/70 text-sm leading-relaxed mb-3">
                                      {description}
                                    </p>
                                  )}
                                  {duration && (
                                    <div className="flex items-center gap-2 text-cyan-200 bg-cyan-500/10 px-3 py-1 rounded-full w-fit mb-2">
                                      <Calendar className="w-4 h-4 text-cyan-400" />
                                      <span className="text-sm">
                                        {duration}
                                      </span>
                                    </div>
                                  )}
                                  {techStack && (
                                    <div className="mt-3">
                                      <h4 className="text-white/80 text-sm font-semibold mb-2">
                                        Technologies:
                                      </h4>
                                      <div className="flex flex-wrap gap-2">
                                        {(typeof techStack === "string"
                                          ? techStack.split(",")
                                          : [techStack]
                                        ).map((tech, i) => (
                                          <span
                                            key={i}
                                            className="px-3 py-1 bg-cyan-500/20 rounded-full text-cyan-300 text-xs"
                                          >
                                            {tech.trim()}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Achievements */}
                    {hasValidItems(data.achievements) && (
                      <Card className="bg-white/10 border-white/20">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg">
                            <Trophy className="w-5 h-5 text-yellow-400 mr-2" />
                            Achievements ({data.achievements.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {data.achievements.map((achievement, idx) => {
                              const title =
                                getValue(achievement, "Title") ||
                                getValue(achievement, "title");
                              const description =
                                getValue(achievement, "Description") ||
                                getValue(achievement, "description");
                              const date =
                                getValue(achievement, "Date") ||
                                getValue(achievement, "year");

                              return (
                                <div
                                  key={idx}
                                  className="p-4 bg-gradient-to-br from-yellow-500/5 to-amber-500/5 rounded-lg border border-yellow-500/10"
                                >
                                  {title && (
                                    <h4 className="text-white font-semibold text-base mb-1">
                                      {title}
                                    </h4>
                                  )}
                                  {description && (
                                    <p className="text-white/70 text-sm leading-relaxed">
                                      {description}
                                    </p>
                                  )}
                                  {date && (
                                    <p className="text-white/50 text-xs mt-2">
                                      {date}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Publications */}
                    {hasValidItems(data.publications) && (
                      <Card className="bg-white/10 border-white/20">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg">
                            <FileText className="w-5 h-5 text-blue-400 mr-2" />
                            Publications ({data.publications.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {data.publications.map((pub, idx) => {
                              const title = getValue(pub, "Title");
                              const authors = getValue(pub, "Authors");
                              const journal = getValue(
                                pub,
                                "Journal/Conference",
                              );
                              const date = getValue(pub, "Date");
                              const doi = getValue(pub, "DOI/Link");

                              return (
                                <div
                                  key={idx}
                                  className="p-4 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-lg border border-blue-500/10"
                                >
                                  {title && (
                                    <h4 className="text-white font-semibold text-base mb-2">
                                      {title}
                                    </h4>
                                  )}
                                  {authors && (
                                    <p className="text-white/70 text-sm mb-1">
                                      Authors: {authors}
                                    </p>
                                  )}
                                  {journal && (
                                    <p className="text-white/70 text-sm mb-2">
                                      {journal}
                                    </p>
                                  )}
                                  <div className="flex gap-4 text-xs text-white/50">
                                    {date && <span>{date}</span>}
                                    {doi && (
                                      <a
                                        href={doi}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:underline flex items-center gap-1"
                                      >
                                        View{" "}
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Research */}
                    {hasValidItems(data.research) && (
                      <Card className="bg-white/10 border-white/20">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg">
                            <BookOpen className="w-5 h-5 text-teal-400 mr-2" />
                            Research Experience ({data.research.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {data.research.map((research, idx) => {
                              const title = getValue(research, "Title");
                              const description = getValue(
                                research,
                                "Description",
                              );
                              const institution = getValue(
                                research,
                                "Institution",
                              );
                              const duration = getValue(research, "Duration");

                              return (
                                <div
                                  key={idx}
                                  className="p-4 bg-gradient-to-br from-teal-500/5 to-cyan-500/5 rounded-lg border border-teal-500/10"
                                >
                                  {title && (
                                    <h4 className="text-white font-semibold text-base mb-2">
                                      {title}
                                    </h4>
                                  )}
                                  {description && (
                                    <p className="text-white/70 text-sm leading-relaxed mb-2">
                                      {description}
                                    </p>
                                  )}
                                  <div className="flex gap-4 text-sm text-white/60">
                                    {institution && <span>{institution}</span>}
                                    {duration && <span>{duration}</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Certifications */}
                    {hasValidItems(data.certifications) && (
                      <Card className="bg-white/10 border-white/20">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg">
                            <FileCheck className="w-5 h-5 text-green-400 mr-2" />
                            Certifications ({data.certifications.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {data.certifications.map((cert, idx) => {
                              const name = getValue(cert, "Name");
                              const issuer = getValue(cert, "Issuer");
                              const date = getValue(cert, "Date");
                              const validity = getValue(cert, "Validity");

                              return (
                                <div
                                  key={idx}
                                  className="p-4 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-lg border border-green-500/10"
                                >
                                  {name && (
                                    <h4 className="text-white font-semibold text-base mb-1">
                                      {name}
                                    </h4>
                                  )}
                                  {issuer && (
                                    <p className="text-white/80 text-sm mb-2">
                                      {issuer}
                                    </p>
                                  )}
                                  <div className="flex gap-4 text-xs text-white/50">
                                    {date && <span>Issued: {date}</span>}
                                    {validity && (
                                      <span>Valid until: {validity}</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Awards */}
                    {hasValidItems(data.awards) && (
                      <Card className="bg-white/10 border-white/20">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg">
                            <Trophy className="w-5 h-5 text-red-400 mr-2" />
                            Awards & Honors ({data.awards.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {data.awards.map((award, idx) => {
                              const title =
                                getValue(award, "Title") ||
                                getValue(award, "name");
                              const issuer =
                                getValue(award, "Issuer") ||
                                getValue(award, "issuer");
                              const description =
                                getValue(award, "Description") ||
                                getValue(award, "description");
                              const date =
                                getValue(award, "Date") ||
                                getValue(award, "year");

                              return (
                                <div
                                  key={idx}
                                  className="p-4 bg-gradient-to-br from-red-500/5 to-orange-500/5 rounded-lg border border-red-500/10"
                                >
                                  {title && (
                                    <h4 className="text-white font-semibold text-base mb-1">
                                      {title}
                                    </h4>
                                  )}
                                  {issuer && (
                                    <p className="text-white/80 text-sm mb-1">
                                      {issuer}
                                    </p>
                                  )}
                                  {description && (
                                    <p className="text-white/70 text-sm leading-relaxed mb-2">
                                      {description}
                                    </p>
                                  )}
                                  {date && (
                                    <p className="text-white/50 text-xs">
                                      {date}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Volunteer Work */}
                    {hasValidItems(data.volunteer_work) && (
                      <Card className="bg-white/10 border-white/20">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg">
                            <Heart className="w-5 h-5 text-pink-400 mr-2" />
                            Volunteer Experience ({data.volunteer_work.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {data.volunteer_work.map((vol, idx) => {
                              const role =
                                getValue(vol, "Role") || getValue(vol, "role");
                              const organization =
                                getValue(vol, "Organization") ||
                                getValue(vol, "organization");
                              const duration =
                                getValue(vol, "Duration") ||
                                getValue(vol, "duration");
                              const description =
                                getValue(vol, "Description") ||
                                getValue(vol, "description");

                              return (
                                <div
                                  key={idx}
                                  className="p-4 bg-gradient-to-br from-pink-500/5 to-rose-500/5 rounded-lg border border-pink-500/10"
                                >
                                  {role && (
                                    <h4 className="text-white font-semibold text-base mb-1">
                                      {role}
                                    </h4>
                                  )}
                                  {organization && (
                                    <p className="text-white/80 text-sm mb-1">
                                      {organization}
                                    </p>
                                  )}
                                  {duration && (
                                    <p className="text-white/60 text-sm mb-2">
                                      {duration}
                                    </p>
                                  )}
                                  {description && (
                                    <p className="text-white/70 text-sm leading-relaxed">
                                      {description}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Languages */}
                    {hasValidLanguages(data.languages) && (
                      <Card className="bg-white/10 border-white/20">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg">
                            <Languages className="w-5 h-5 text-violet-400 mr-2" />
                            Languages ({data.languages.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-3">
                            {data.languages.map((lang, idx) => {
                              const language = getValue(lang, "Language");
                              const proficiency = getValue(lang, "Proficiency");

                              return (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-3 bg-gradient-to-r from-violet-500/5 to-purple-500/5 rounded-lg border border-violet-500/10"
                                >
                                  <span className="text-white font-medium text-sm">
                                    {language}
                                  </span>
                                  {proficiency && (
                                    <span className="px-3 py-1 bg-violet-500/20 rounded-full text-violet-300 text-xs">
                                      {proficiency}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Interests */}
                    {hasValidSkills(data.interests) && (
                      <Card className="bg-white/10 border-white/20">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg">
                            <Sparkles className="w-5 h-5 text-fuchsia-400 mr-2" />
                            Interests & Hobbies ({data.interests.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {data.interests.map((interest, idx) => (
                              <span
                                key={idx}
                                className="px-4 py-2 bg-gradient-to-r from-fuchsia-600/20 to-purple-600/20 border border-fuchsia-500/30 rounded-full text-white text-sm font-medium"
                              >
                                {interest}
                              </span>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Social & Professional Links */}
                    {(data.linkedin_url ||
                      data.github_url ||
                      data.portfolio_url ||
                      data.personal_website) && (
                      <Card className="bg-white/10 border-white/20">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg">
                            <LinkIcon className="w-5 h-5 text-sky-400 mr-2" />
                            Professional & Social Links
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {data.linkedin_url && (
                              <a
                                href={
                                  data.linkedin_url.startsWith("http")
                                    ? data.linkedin_url
                                    : `https://${data.linkedin_url}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all"
                              >
                                {data.linkedin_url.includes("researchgate") ? (
                                  <BookOpen className="w-5 h-5 text-sky-400 flex-shrink-0" />
                                ) : (
                                  <Linkedin className="w-5 h-5 text-sky-400 flex-shrink-0" />
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="text-white/50 text-xs mb-1">
                                    {data.linkedin_url.includes("researchgate")
                                      ? "ResearchGate"
                                      : "LinkedIn"}
                                  </p>
                                  <p className="text-white text-sm truncate">
                                    {data.linkedin_url}
                                  </p>
                                </div>
                                <ExternalLink className="w-4 h-4 text-sky-400 flex-shrink-0" />
                              </a>
                            )}
                            {data.github_url && (
                              <a
                                href={
                                  data.github_url.startsWith("http")
                                    ? data.github_url
                                    : `https://${data.github_url}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all"
                              >
                                <Github className="w-5 h-5 text-sky-400 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-white/50 text-xs mb-1">
                                    GitHub
                                  </p>
                                  <p className="text-white text-sm truncate">
                                    {data.github_url}
                                  </p>
                                </div>
                                <ExternalLink className="w-4 h-4 text-sky-400 flex-shrink-0" />
                              </a>
                            )}
                            {data.portfolio_url && (
                              <a
                                href={
                                  data.portfolio_url.startsWith("http")
                                    ? data.portfolio_url
                                    : `https://${data.portfolio_url}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all"
                              >
                                <Briefcase className="w-5 h-5 text-sky-400 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-white/50 text-xs mb-1">
                                    Portfolio
                                  </p>
                                  <p className="text-white text-sm truncate">
                                    {data.portfolio_url}
                                  </p>
                                </div>
                                <ExternalLink className="w-4 h-4 text-sky-400 flex-shrink-0" />
                              </a>
                            )}
                            {data.personal_website && (
                              <a
                                href={
                                  data.personal_website.startsWith("http")
                                    ? data.personal_website
                                    : `https://${data.personal_website}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all"
                              >
                                <Globe className="w-5 h-5 text-sky-400 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-white/50 text-xs mb-1">
                                    Personal Website
                                  </p>
                                  <p className="text-white text-sm truncate">
                                    {data.personal_website}
                                  </p>
                                </div>
                                <ExternalLink className="w-4 h-4 text-sky-400 flex-shrink-0" />
                              </a>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* References */}
                    {hasValidItems(data.references) && (
                      <Card className="bg-white/10 border-white/20">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg">
                            <Users className="w-5 h-5 text-slate-400 mr-2" />
                            References ({data.references.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {data.references.map((ref, idx) => {
                              const name = getValue(ref, "Name");
                              const title = getValue(ref, "Title");
                              const relationship = getValue(
                                ref,
                                "Relationship",
                              );
                              const contact = getValue(ref, "Contact");

                              return (
                                <div
                                  key={idx}
                                  className="p-4 bg-gradient-to-br from-slate-500/5 to-gray-500/5 rounded-lg border border-slate-500/10"
                                >
                                  {name && (
                                    <h4 className="text-white font-semibold text-base mb-1">
                                      {name}
                                    </h4>
                                  )}
                                  {title && (
                                    <p className="text-white/70 text-sm mb-1">
                                      {title}
                                    </p>
                                  )}
                                  {relationship && (
                                    <p className="text-white/60 text-sm mb-1">
                                      {relationship}
                                    </p>
                                  )}
                                  {contact && (
                                    <p className="text-white/70 text-sm">
                                      {contact}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Extra Sections */}
                    {data.extra_sections &&
                      Object.keys(data.extra_sections).length > 0 && (
                        <Card className="bg-white/10 border-white/20">
                          <CardHeader className="pb-4">
                            <CardTitle className="flex items-center text-white text-lg">
                              <Plus className="w-5 h-5 text-amber-400 mr-2" />
                              Additional Information (
                              {Object.keys(data.extra_sections).length})
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {Object.entries(data.extra_sections).map(
                              ([sectionName, sectionData], idx) => (
                                <div
                                  key={idx}
                                  className="p-4 bg-gradient-to-br from-amber-500/5 to-yellow-500/5 rounded-lg border border-amber-500/10"
                                >
                                  <h4 className="text-white font-semibold text-base mb-3">
                                    {sectionName}
                                  </h4>
                                  <div className="space-y-2 pl-3 border-l-2 border-amber-500/20">
                                    {Array.isArray(sectionData) ? (
                                      sectionData.map((item, itemIdx) => (
                                        <div
                                          key={itemIdx}
                                          className="text-sm text-white/70"
                                        >
                                          {typeof item === "object" ? (
                                            <div className="space-y-1">
                                              {Object.entries(item).map(
                                                ([key, value]) => (
                                                  <div key={key}>
                                                    <span className="font-medium text-white/80">
                                                      {key}:
                                                    </span>{" "}
                                                    {value}
                                                  </div>
                                                ),
                                              )}
                                            </div>
                                          ) : (
                                            <span>{item}</span>
                                          )}
                                        </div>
                                      ))
                                    ) : (
                                      <p className="text-sm text-white/70">
                                        {JSON.stringify(sectionData)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ),
                            )}
                          </CardContent>
                        </Card>
                      )}
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default RecruiterCandidates;
