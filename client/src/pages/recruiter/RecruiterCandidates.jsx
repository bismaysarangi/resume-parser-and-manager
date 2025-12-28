import { useState, useEffect, useRef } from "react";
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
  Filter,
  Download,
  Eye,
  Trash2,
  Users,
  Sparkles,
  X,
  MessageCircle,
  Send,
  Bot,
  Minimize2,
  Maximize2,
  ArrowLeft,
  Trophy,
  Heart,
  Languages,
  BookOpen,
  FileCheck,
  FileText,
  Plus,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:8000";

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
        !(Array.isArray(value) && value.length === 0)
    );
  });
};

const hasValidSkills = (skills) => {
  return (
    skills &&
    Array.isArray(skills) &&
    skills.length > 0 &&
    skills.some((skill) => skill && skill.trim() !== "")
  );
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
        }
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
                  className="bg-white/10 backdrop-blur-sm border-white/20 hover:border-white/40 transition-all cursor-pointer group"
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
                      <Eye className="w-5 h-5 text-white/40 group-hover:text-white/80 transition-colors flex-shrink-0" />
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

      {/* Detail Modal */}
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/60 hover:text-white hover:bg-white/10"
                  onClick={() => setShowDetailModal(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
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
                    {(data.name || data.email || data.phone) && (
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
                          </div>
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
                            {data.education.map((edu, idx) => (
                              <div
                                key={idx}
                                className="p-4 bg-gradient-to-br from-indigo-500/5 to-blue-500/5 rounded-lg border border-indigo-500/10"
                              >
                                {edu.Degree && (
                                  <h4 className="text-white font-semibold text-base mb-1">
                                    {edu.Degree}
                                  </h4>
                                )}
                                {edu.University && (
                                  <p className="text-white/80 text-sm mb-2">
                                    {edu.University}
                                  </p>
                                )}
                                <div className="flex flex-wrap gap-4 mt-2">
                                  {edu.Grade && (
                                    <span className="text-white/70 text-sm">
                                      Grade: {edu.Grade}
                                    </span>
                                  )}
                                  {edu.Years && (
                                    <span className="text-white/70 text-sm">
                                      Years: {edu.Years}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
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
                            {data.experience.map((exp, idx) => (
                              <div
                                key={idx}
                                className="p-4 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-lg border border-green-500/10"
                              >
                                {exp.Role && (
                                  <h4 className="text-white font-semibold text-base mb-1">
                                    {exp.Role}
                                  </h4>
                                )}
                                {exp.Company && (
                                  <div className="flex items-center gap-2 text-white/80 mb-2">
                                    <Building2 className="w-4 h-4 text-green-400" />
                                    <span className="text-sm">
                                      {exp.Company}
                                    </span>
                                  </div>
                                )}
                                {exp.Years && (
                                  <div className="flex items-center gap-2 text-white/60 bg-green-500/10 px-3 py-1 rounded-full w-fit">
                                    <Calendar className="w-4 h-4 text-green-400" />
                                    <span className="text-sm">{exp.Years}</span>
                                  </div>
                                )}
                              </div>
                            ))}
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
                            {data.achievements.map((achievement, idx) => (
                              <div
                                key={idx}
                                className="p-4 bg-gradient-to-br from-yellow-500/5 to-amber-500/5 rounded-lg border border-yellow-500/10"
                              >
                                {achievement.Title && (
                                  <h4 className="text-white font-semibold text-base mb-1">
                                    {achievement.Title}
                                  </h4>
                                )}
                                {achievement.Description && (
                                  <p className="text-white/70 text-sm leading-relaxed">
                                    {achievement.Description}
                                  </p>
                                )}
                                {achievement.Date && (
                                  <p className="text-white/50 text-xs mt-2">
                                    {achievement.Date}
                                  </p>
                                )}
                              </div>
                            ))}
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
                            {data.publications.map((pub, idx) => (
                              <div
                                key={idx}
                                className="p-4 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-lg border border-blue-500/10"
                              >
                                {pub.Title && (
                                  <h4 className="text-white font-semibold text-base mb-2">
                                    {pub.Title}
                                  </h4>
                                )}
                                {pub.Authors && (
                                  <p className="text-white/70 text-sm mb-1">
                                    Authors: {pub.Authors}
                                  </p>
                                )}
                                {pub["Journal/Conference"] && (
                                  <p className="text-white/70 text-sm mb-2">
                                    {pub["Journal/Conference"]}
                                  </p>
                                )}
                                <div className="flex gap-4 text-xs text-white/50">
                                  {pub.Date && <span>{pub.Date}</span>}
                                  {pub["DOI/Link"] && (
                                    <a
                                      href={pub["DOI/Link"]}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-400 hover:underline flex items-center gap-1"
                                    >
                                      View <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))}
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
                            {data.research.map((research, idx) => (
                              <div
                                key={idx}
                                className="p-4 bg-gradient-to-br from-teal-500/5 to-cyan-500/5 rounded-lg border border-teal-500/10"
                              >
                                {research.Title && (
                                  <h4 className="text-white font-semibold text-base mb-2">
                                    {research.Title}
                                  </h4>
                                )}
                                {research.Description && (
                                  <p className="text-white/70 text-sm leading-relaxed mb-2">
                                    {research.Description}
                                  </p>
                                )}
                                <div className="flex gap-4 text-sm text-white/60">
                                  {research.Institution && (
                                    <span>{research.Institution}</span>
                                  )}
                                  {research.Duration && (
                                    <span>{research.Duration}</span>
                                  )}
                                </div>
                              </div>
                            ))}
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
                            {data.certifications.map((cert, idx) => (
                              <div
                                key={idx}
                                className="p-4 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-lg border border-green-500/10"
                              >
                                {cert.Name && (
                                  <h4 className="text-white font-semibold text-base mb-1">
                                    {cert.Name}
                                  </h4>
                                )}
                                {cert.Issuer && (
                                  <p className="text-white/80 text-sm mb-2">
                                    {cert.Issuer}
                                  </p>
                                )}
                                <div className="flex gap-4 text-xs text-white/50">
                                  {cert.Date && (
                                    <span>Issued: {cert.Date}</span>
                                  )}
                                  {cert.Validity && (
                                    <span>Valid until: {cert.Validity}</span>
                                  )}
                                </div>
                              </div>
                            ))}
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
                            {data.awards.map((award, idx) => (
                              <div
                                key={idx}
                                className="p-4 bg-gradient-to-br from-red-500/5 to-orange-500/5 rounded-lg border border-red-500/10"
                              >
                                {award.Title && (
                                  <h4 className="text-white font-semibold text-base mb-1">
                                    {award.Title}
                                  </h4>
                                )}
                                {award.Issuer && (
                                  <p className="text-white/80 text-sm mb-1">
                                    {award.Issuer}
                                  </p>
                                )}
                                {award.Description && (
                                  <p className="text-white/70 text-sm leading-relaxed mb-2">
                                    {award.Description}
                                  </p>
                                )}
                                {award.Date && (
                                  <p className="text-white/50 text-xs">
                                    {award.Date}
                                  </p>
                                )}
                              </div>
                            ))}
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
                            {data.volunteer_work.map((vol, idx) => (
                              <div
                                key={idx}
                                className="p-4 bg-gradient-to-br from-pink-500/5 to-rose-500/5 rounded-lg border border-pink-500/10"
                              >
                                {vol.Role && (
                                  <h4 className="text-white font-semibold text-base mb-1">
                                    {vol.Role}
                                  </h4>
                                )}
                                {vol.Organization && (
                                  <p className="text-white/80 text-sm mb-1">
                                    {vol.Organization}
                                  </p>
                                )}
                                {vol.Duration && (
                                  <p className="text-white/60 text-sm mb-2">
                                    {vol.Duration}
                                  </p>
                                )}
                                {vol.Description && (
                                  <p className="text-white/70 text-sm leading-relaxed">
                                    {vol.Description}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Languages */}
                    {hasValidItems(data.languages) && (
                      <Card className="bg-white/10 border-white/20">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg">
                            <Languages className="w-5 h-5 text-violet-400 mr-2" />
                            Languages ({data.languages.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-3">
                            {data.languages.map((lang, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-3 bg-gradient-to-r from-violet-500/5 to-purple-500/5 rounded-lg border border-violet-500/10"
                              >
                                <span className="text-white font-medium text-sm">
                                  {lang.Language}
                                </span>
                                <span className="px-3 py-1 bg-violet-500/20 rounded-full text-violet-300 text-xs">
                                  {lang.Proficiency}
                                </span>
                              </div>
                            ))}
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
                            {data.references.map((ref, idx) => (
                              <div
                                key={idx}
                                className="p-4 bg-gradient-to-br from-slate-500/5 to-gray-500/5 rounded-lg border border-slate-500/10"
                              >
                                {ref.Name && (
                                  <h4 className="text-white font-semibold text-base mb-1">
                                    {ref.Name}
                                  </h4>
                                )}
                                {ref.Title && (
                                  <p className="text-white/70 text-sm mb-1">
                                    {ref.Title}
                                  </p>
                                )}
                                {ref.Relationship && (
                                  <p className="text-white/60 text-sm mb-1">
                                    {ref.Relationship}
                                  </p>
                                )}
                                {ref.Contact && (
                                  <p className="text-white/70 text-sm">
                                    {ref.Contact}
                                  </p>
                                )}
                              </div>
                            ))}
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
                                                )
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
                              )
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
                            {data.projects.map((project, idx) => (
                              <div
                                key={idx}
                                className="p-4 bg-gradient-to-br from-cyan-500/5 to-teal-500/5 rounded-lg border border-cyan-500/10"
                              >
                                {project.Name && (
                                  <h4 className="text-white font-semibold text-base mb-2">
                                    {project.Name}
                                  </h4>
                                )}
                                {project.Description && (
                                  <p className="text-white/70 text-sm leading-relaxed mb-3">
                                    {project.Description}
                                  </p>
                                )}
                                {project["Tech Stack"] && (
                                  <div className="mt-3">
                                    <h4 className="text-white/80 text-sm font-semibold mb-2">
                                      Technologies:
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                      {(typeof project["Tech Stack"] ===
                                      "string"
                                        ? project["Tech Stack"].split(",")
                                        : [project["Tech Stack"]]
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
                            ))}
                          </div>
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
