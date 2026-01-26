import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  GraduationCap,
  Briefcase,
  Code,
  Award,
  Calendar,
  Building2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Trophy,
  Heart,
  Languages,
  BookOpen,
  FileCheck,
  FileText,
  MapPin,
  Home,
  Flag,
  UserCircle,
  Cake,
  Shield,
  Globe,
  Clock,
  Plane,
  DollarSign,
  Target,
  Star,
  LinkIcon,
  Github,
  Linkedin,
  ExternalLink,
  Activity,
  Brain,
  Plus,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

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
    skills.some((skill) => skill && typeof skill === 'string' && skill.trim() !== "")
  );
};

const hasValidLanguages = (languages) => {
  if (!languages || !Array.isArray(languages) || languages.length === 0) return false;
  return languages.some((lang) => lang && lang.Language && lang.Language.trim() !== "");
};

const RecruiterBulkResults = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [results, setResults] = useState(null);
  const [expandedIdx, setExpandedIdx] = useState(null);

  useEffect(() => {
    const stateFromRouter = location?.state || null;
    if (
      stateFromRouter &&
      (stateFromRouter.successful || stateFromRouter.failed)
    ) {
      setResults(stateFromRouter);
      return;
    }
    const ls = localStorage.getItem("bulkResults");
    if (ls) {
      try {
        setResults(JSON.parse(ls));
        return;
      } catch {
        // ignore parse error
      }
    }
    setTimeout(() => navigate("/recruiter/bulk-upload"), 250);
  }, [location, navigate]);

  if (!results) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "rgb(34, 24, 36)" }}
      >
        <Card className="bg-gray-900/60 backdrop-blur-sm border-white/10 max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 text-white/60 mx-auto mb-4 flex items-center justify-center">
              <User className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              No Data Found
            </h2>
            <p className="text-white/70 mb-6">Please upload resumes first.</p>
            <Button
              className="bg-white text-black hover:bg-white/90"
              onClick={() => navigate("/recruiter/bulk-upload")}
            >
              Go to Upload
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const successful = results.successful || [];
  const failed = results.failed || [];

  return (
    <div
      className="min-h-screen pt-16"
      style={{ backgroundColor: "rgb(34, 24, 36)" }}
    >
      <div className="container mx-auto max-w-7xl py-6 sm:py-8 px-4 sm:px-6 mt-4">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="outline"
            className="bg-white text-black hover:bg-white/90 px-7 py-5 text-lg font-semibold"
            onClick={() => navigate("/recruiter/bulk-upload")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Upload
          </Button>
          <h1 className="text-3xl font-bold text-white">Parsed Resumes</h1>
          <div className="w-32"></div>
        </div>

        <div className="space-y-6">
          {successful.map((item, idx) => {
            const parsedData = item.data || item.parsed_data || {};
            const name = parsedData.name || "Unknown Candidate";

            return (
              <Card
                key={idx}
                className="bg-gray-900/40 backdrop-blur-md border-white/10 hover:border-white/30 transition-all"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-white text-lg sm:text-xl">
                      <div className="p-2 bg-blue-500/20 rounded-lg mr-3">
                        <User className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                      </div>
                      {name}
                      <span className="ml-2 text-white/60 text-sm font-normal">
                        ({idx + 1} of {successful.length})
                      </span>
                    </CardTitle>
                    <button
                      className="ml-3 p-2 rounded bg-white/5 hover:bg-white/10 transition-all"
                      onClick={() =>
                        setExpandedIdx(expandedIdx === idx ? null : idx)
                      }
                      aria-label="Toggle details"
                    >
                      {expandedIdx === idx ? (
                        <ChevronUp className="w-5 h-5 text-white" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-white" />
                      )}
                    </button>
                  </div>
                </CardHeader>

                {expandedIdx === idx && (
                  <CardContent className="space-y-6">
                    {/* Personal Information */}
                    {(parsedData.name || parsedData.email || parsedData.phone || parsedData.gender || 
                      parsedData.date_of_birth || parsedData.age || parsedData.nationality || parsedData.marital_status) && (
                      <Card className="bg-black/20 backdrop-blur-sm border-blue-500/20">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg font-semibold">
                            <div className="p-2 bg-blue-500/20 rounded-lg mr-3">
                              <User className="w-5 h-5 text-blue-400" />
                            </div>
                            Personal Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {parsedData.name && (
                              <div className="flex items-start gap-3 p-3 bg-gray-900/50 border border-white/5 rounded-lg">
                                <User className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-white/50 text-xs sm:text-sm mb-1">Full Name</p>
                                  <p className="text-white font-medium text-sm sm:text-base break-words">{parsedData.name}</p>
                                </div>
                              </div>
                            )}
                            {parsedData.email && (
                              <div className="flex items-start gap-3 p-3 bg-gray-900/50 border border-white/5 rounded-lg">
                                <Mail className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-white/50 text-xs sm:text-sm mb-1">Email Address</p>
                                  <p className="text-white font-medium text-sm sm:text-base break-words">{parsedData.email}</p>
                                </div>
                              </div>
                            )}
                            {parsedData.phone && (
                              <div className="flex items-start gap-3 p-3 bg-gray-900/50 border border-white/5 rounded-lg">
                                <Phone className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-white/50 text-xs sm:text-sm mb-1">Phone Number</p>
                                  <p className="text-white font-medium text-sm sm:text-base">{parsedData.phone}</p>
                                </div>
                              </div>
                            )}
                            {parsedData.gender && (
                              <div className="flex items-start gap-3 p-3 bg-gray-900/50 border border-white/5 rounded-lg">
                                <UserCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-white/50 text-xs sm:text-sm mb-1">Gender</p>
                                  <p className="text-white font-medium text-sm sm:text-base">{parsedData.gender}</p>
                                </div>
                              </div>
                            )}
                            {parsedData.date_of_birth && (
                              <div className="flex items-start gap-3 p-3 bg-gray-900/50 border border-white/5 rounded-lg">
                                <Cake className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-white/50 text-xs sm:text-sm mb-1">Date of Birth</p>
                                  <p className="text-white font-medium text-sm sm:text-base">{parsedData.date_of_birth}</p>
                                </div>
                              </div>
                            )}
                            {parsedData.age && (
                              <div className="flex items-start gap-3 p-3 bg-gray-900/50 border border-white/5 rounded-lg">
                                <Calendar className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-white/50 text-xs sm:text-sm mb-1">Age</p>
                                  <p className="text-white font-medium text-sm sm:text-base">{parsedData.age} years</p>
                                </div>
                              </div>
                            )}
                            {parsedData.nationality && (
                              <div className="flex items-start gap-3 p-3 bg-gray-900/50 border border-white/5 rounded-lg">
                                <Flag className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-white/50 text-xs sm:text-sm mb-1">Nationality</p>
                                  <p className="text-white font-medium text-sm sm:text-base">{parsedData.nationality}</p>
                                </div>
                              </div>
                            )}
                            {parsedData.marital_status && (
                              <div className="flex items-start gap-3 p-3 bg-gray-900/50 border border-white/5 rounded-lg">
                                <Heart className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-white/50 text-xs sm:text-sm mb-1">Marital Status</p>
                                  <p className="text-white font-medium text-sm sm:text-base">{parsedData.marital_status}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Location Information */}
                    {(parsedData.current_location || parsedData.permanent_address || parsedData.hometown || 
                      hasValidSkills(parsedData.preferred_locations) || parsedData.willing_to_relocate !== null) && (
                      <Card className="bg-black/20 backdrop-blur-sm border-emerald-500/20">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg font-semibold">
                            <div className="p-2 bg-emerald-500/20 rounded-lg mr-3">
                              <MapPin className="w-5 h-5 text-emerald-400" />
                            </div>
                            Location Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {parsedData.current_location && (
                              <div className="flex items-start gap-3 p-3 bg-gray-900/50 border border-white/5 rounded-lg">
                                <MapPin className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-white/50 text-xs sm:text-sm mb-1">Current Location</p>
                                  <p className="text-white font-medium text-sm sm:text-base">{parsedData.current_location}</p>
                                </div>
                              </div>
                            )}
                            {parsedData.permanent_address && (
                              <div className="flex items-start gap-3 p-3 bg-gray-900/50 border border-white/5 rounded-lg">
                                <Home className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-white/50 text-xs sm:text-sm mb-1">Permanent Address</p>
                                  <p className="text-white font-medium text-sm sm:text-base">{parsedData.permanent_address}</p>
                                </div>
                              </div>
                            )}
                            {parsedData.hometown && (
                              <div className="flex items-start gap-3 p-3 bg-gray-900/50 border border-white/5 rounded-lg">
                                <Home className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-white/50 text-xs sm:text-sm mb-1">Hometown</p>
                                  <p className="text-white font-medium text-sm sm:text-base">{parsedData.hometown}</p>
                                </div>
                              </div>
                            )}
                            {parsedData.willing_to_relocate !== null && (
                              <div className="flex items-start gap-3 p-3 bg-gray-900/50 border border-white/5 rounded-lg">
                                <Plane className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-white/50 text-xs sm:text-sm mb-1">Willing to Relocate</p>
                                  <p className="text-white font-medium text-sm sm:text-base">
                                    {parsedData.willing_to_relocate ? "Yes" : "No"}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                          {hasValidSkills(parsedData.preferred_locations) && (
                            <div className="mt-4">
                              <p className="text-white/50 text-xs sm:text-sm mb-2">Preferred Locations</p>
                              <div className="flex flex-wrap gap-2">
                                {parsedData.preferred_locations.map((loc, index) => (
                                  <span key={index} className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-white text-xs sm:text-sm">
                                    {loc}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Work Authorization & Availability */}
                    {(parsedData.work_authorization || parsedData.visa_status || parsedData.notice_period || parsedData.availability_date) && (
                      <Card className="bg-black/20 backdrop-blur-sm border-purple-500/20">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg font-semibold">
                            <div className="p-2 bg-purple-500/20 rounded-lg mr-3">
                              <Shield className="w-5 h-5 text-purple-400" />
                            </div>
                            Work Authorization & Availability
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {parsedData.work_authorization && (
                              <div className="flex items-start gap-3 p-3 bg-gray-900/50 border border-white/5 rounded-lg">
                                <Shield className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-white/50 text-xs sm:text-sm mb-1">Work Authorization</p>
                                  <p className="text-white font-medium text-sm sm:text-base">{parsedData.work_authorization}</p>
                                </div>
                              </div>
                            )}
                            {parsedData.visa_status && (
                              <div className="flex items-start gap-3 p-3 bg-gray-900/50 border border-white/5 rounded-lg">
                                <Globe className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-white/50 text-xs sm:text-sm mb-1">Visa Status</p>
                                  <p className="text-white font-medium text-sm sm:text-base">{parsedData.visa_status}</p>
                                </div>
                              </div>
                            )}
                            {parsedData.notice_period && (
                              <div className="flex items-start gap-3 p-3 bg-gray-900/50 border border-white/5 rounded-lg">
                                <Clock className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-white/50 text-xs sm:text-sm mb-1">Notice Period</p>
                                  <p className="text-white font-medium text-sm sm:text-base">{parsedData.notice_period}</p>
                                </div>
                              </div>
                            )}
                            {parsedData.availability_date && (
                              <div className="flex items-start gap-3 p-3 bg-gray-900/50 border border-white/5 rounded-lg">
                                <Calendar className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-white/50 text-xs sm:text-sm mb-1">Availability Date</p>
                                  <p className="text-white font-medium text-sm sm:text-base">{parsedData.availability_date}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Compensation */}
                    {(parsedData.current_ctc || parsedData.expected_ctc || parsedData.current_salary || parsedData.expected_salary) && (
                      <Card className="bg-black/20 backdrop-blur-sm border-amber-500/20">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg font-semibold">
                            <div className="p-2 bg-amber-500/20 rounded-lg mr-3">
                              <DollarSign className="w-5 h-5 text-amber-400" />
                            </div>
                            Compensation
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {parsedData.current_ctc && (
                              <div className="flex items-start gap-3 p-3 bg-gray-900/50 border border-white/5 rounded-lg">
                                <DollarSign className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-white/50 text-xs sm:text-sm mb-1">Current CTC</p>
                                  <p className="text-white font-medium text-sm sm:text-base">{parsedData.current_ctc}</p>
                                </div>
                              </div>
                            )}
                            {parsedData.expected_ctc && (
                              <div className="flex items-start gap-3 p-3 bg-gray-900/50 border border-white/5 rounded-lg">
                                <DollarSign className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-white/50 text-xs sm:text-sm mb-1">Expected CTC</p>
                                  <p className="text-white font-medium text-sm sm:text-base">{parsedData.expected_ctc}</p>
                                </div>
                              </div>
                            )}
                            {parsedData.current_salary && (
                              <div className="flex items-start gap-3 p-3 bg-gray-900/50 border border-white/5 rounded-lg">
                                <DollarSign className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-white/50 text-xs sm:text-sm mb-1">Current Salary</p>
                                  <p className="text-white font-medium text-sm sm:text-base">{parsedData.current_salary}</p>
                                </div>
                              </div>
                            )}
                            {parsedData.expected_salary && (
                              <div className="flex items-start gap-3 p-3 bg-gray-900/50 border border-white/5 rounded-lg">
                                <DollarSign className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-white/50 text-xs sm:text-sm mb-1">Expected Salary</p>
                                  <p className="text-white font-medium text-sm sm:text-base">{parsedData.expected_salary}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Summary/Objective */}
                    {(parsedData.summary && parsedData.summary.trim() !== "" || 
                      parsedData.objective && parsedData.objective.trim() !== "" || 
                      parsedData.career_objective && parsedData.career_objective.trim() !== "") && (
                      <Card className="bg-black/20 backdrop-blur-sm border-sky-500/20">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg font-semibold">
                            <div className="p-2 bg-sky-500/20 rounded-lg mr-3">
                              <Target className="w-5 h-5 text-sky-400" />
                            </div>
                            Professional Summary
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {parsedData.summary && parsedData.summary.trim() !== "" && (
                            <div className="p-4 bg-gray-900/50 border border-white/5 rounded-lg">
                              <h4 className="text-white/80 text-sm font-semibold mb-2">Summary</h4>
                              <p className="text-white/70 text-sm leading-relaxed">{parsedData.summary}</p>
                            </div>
                          )}
                          {parsedData.objective && parsedData.objective.trim() !== "" && (
                            <div className="p-4 bg-gray-900/50 border border-white/5 rounded-lg">
                              <h4 className="text-white/80 text-sm font-semibold mb-2">Objective</h4>
                              <p className="text-white/70 text-sm leading-relaxed">{parsedData.objective}</p>
                            </div>
                          )}
                          {parsedData.career_objective && parsedData.career_objective.trim() !== "" && (
                            <div className="p-4 bg-gray-900/50 border border-white/5 rounded-lg">
                              <h4 className="text-white/80 text-sm font-semibold mb-2">Career Objective</h4>
                              <p className="text-white/70 text-sm leading-relaxed">{parsedData.career_objective}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Education */}
                    {hasValidItems(parsedData.education) && (
                      <Card className="bg-black/20 backdrop-blur-sm border-white/10">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg font-semibold">
                            <div className="p-2 bg-indigo-500/20 rounded-lg mr-3">
                              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
                            </div>
                            Education
                            <span className="ml-2 text-white/50 text-sm font-normal">
                              ({parsedData.education.length})
                            </span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {parsedData.education.map((edu, index) => (
                              <div
                                key={index}
                                className="p-4 sm:p-5 bg-gray-900/50 rounded-lg border border-indigo-500/10 hover:border-indigo-500/30 transition-all"
                              >
                                {edu.Degree && <h4 className="text-white font-semibold text-base sm:text-lg mb-1">{edu.Degree}</h4>}
                                {edu.University && <p className="text-gray-300 text-sm sm:text-base mb-2">{edu.University}</p>}
                                {(edu.Grade || edu.Years) && (
                                  <div className="flex flex-wrap gap-4 mt-2">
                                    {edu.Grade && <span className="text-white/60 text-sm">Grade: {edu.Grade}</span>}
                                    {edu.Years && <span className="text-white/60 text-sm">Years: {edu.Years}</span>}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Academic Marks */}
                    {(parsedData.tenth_marks || parsedData.twelfth_marks || parsedData.graduation_year || 
                      parsedData.current_year_of_study || parsedData.university_roll_number || parsedData.student_id) && (
                      <Card className="bg-black/20 backdrop-blur-sm border-rose-500/20">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg font-semibold">
                            <div className="p-2 bg-rose-500/20 rounded-lg mr-3">
                              <Award className="w-5 h-5 text-rose-400" />
                            </div>
                            Academic Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {parsedData.tenth_marks && (
                              <div className="flex items-start gap-3 p-3 bg-gray-900/50 border border-white/5 rounded-lg">
                                <Award className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-white/50 text-xs sm:text-sm mb-1">10th Grade Marks</p>
                                  <p className="text-white font-medium text-sm sm:text-base">{parsedData.tenth_marks}</p>
                                </div>
                              </div>
                            )}
                            {parsedData.twelfth_marks && (
                              <div className="flex items-start gap-3 p-3 bg-gray-900/50 border border-white/5 rounded-lg">
                                <Award className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-white/50 text-xs sm:text-sm mb-1">12th Grade Marks</p>
                                  <p className="text-white font-medium text-sm sm:text-base">{parsedData.twelfth_marks}</p>
                                </div>
                              </div>
                            )}
                            {parsedData.graduation_year && (
                              <div className="flex items-start gap-3 p-3 bg-gray-900/50 border border-white/5 rounded-lg">
                                <Calendar className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-white/50 text-xs sm:text-sm mb-1">Graduation Year</p>
                                  <p className="text-white font-medium text-sm sm:text-base">{parsedData.graduation_year}</p>
                                </div>
                              </div>
                            )}
                            {parsedData.current_year_of_study && (
                              <div className="flex items-start gap-3 p-3 bg-gray-900/50 border border-white/5 rounded-lg">
                                <Calendar className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-white/50 text-xs sm:text-sm mb-1">Current Year of Study</p>
                                  <p className="text-white font-medium text-sm sm:text-base">{parsedData.current_year_of_study}</p>
                                </div>
                              </div>
                            )}
                            {parsedData.university_roll_number && (
                              <div className="flex items-start gap-3 p-3 bg-gray-900/50 border border-white/5 rounded-lg">
                                <FileText className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-white/50 text-xs sm:text-sm mb-1">University Roll Number</p>
                                  <p className="text-white font-medium text-sm sm:text-base">{parsedData.university_roll_number}</p>
                                </div>
                              </div>
                            )}
                            {parsedData.student_id && (
                              <div className="flex items-start gap-3 p-3 bg-gray-900/50 border border-white/5 rounded-lg">
                                <FileText className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-white/50 text-xs sm:text-sm mb-1">Student ID</p>
                                  <p className="text-white font-medium text-sm sm:text-base">{parsedData.student_id}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Work Experience */}
                    {hasValidItems(parsedData.experience) && (
                      <Card className="bg-black/20 backdrop-blur-sm border-white/10">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg font-semibold">
                            <div className="p-2 bg-green-500/20 rounded-lg mr-3">
                              <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                            </div>
                            Work Experience
                            <span className="ml-2 text-white/50 text-sm font-normal">
                              ({parsedData.experience.length})
                            </span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {parsedData.experience.map((exp, index) => (
                              <div
                                key={index}
                                className="p-4 sm:p-5 bg-gray-900/50 rounded-lg border border-green-500/10 hover:border-green-500/30 transition-all"
                              >
                                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-2 mb-3">
                                  <div className="flex-1">
                                    {exp.Role && <h4 className="text-white font-semibold text-base sm:text-lg mb-1">{exp.Role}</h4>}
                                    {exp.Company && (
                                      <div className="flex items-center gap-2 text-gray-300 mb-2">
                                        <Building2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                                        <span className="text-sm sm:text-base">{exp.Company}</span>
                                      </div>
                                    )}
                                    {exp.Description && <p className="text-white/70 text-sm mt-2 leading-relaxed">{exp.Description}</p>}
                                  </div>
                                  {exp.Years && (
                                    <div className="flex items-center gap-2 text-white/70 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                                      <Calendar className="w-4 h-4 text-green-400 flex-shrink-0" />
                                      <span className="text-xs sm:text-sm whitespace-nowrap">{exp.Years}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Internships */}
                    {hasValidItems(parsedData.internships) && (
                      <Card className="bg-black/20 backdrop-blur-sm border-teal-500/20">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg font-semibold">
                            <div className="p-2 bg-teal-500/20 rounded-lg mr-3">
                              <Briefcase className="w-5 h-5 text-teal-400" />
                            </div>
                            Internships ({parsedData.internships.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {parsedData.internships.map((intern, idx) => (
                              <div key={idx} className="p-4 bg-gray-900/50 rounded-lg border border-teal-500/10">
                                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-2 mb-3">
                                  <div className="flex-1">
                                    {intern.Role && <h4 className="text-white font-semibold text-base mb-1">{intern.Role}</h4>}
                                    {intern.Company && (
                                      <div className="flex items-center gap-2 text-gray-300 mb-2">
                                        <Building2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
                                        <span className="text-sm">{intern.Company}</span>
                                      </div>
                                    )}
                                    {intern.Description && <p className="text-white/70 text-sm mt-2">{intern.Description}</p>}
                                  </div>
                                  {intern.Duration && (
                                    <div className="flex items-center gap-2 text-teal-200 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
                                      <Calendar className="w-4 h-4 text-teal-400 flex-shrink-0" />
                                      <span className="text-xs">{intern.Duration}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Skills */}
                    {hasValidSkills(parsedData.skills) && (
                      <Card className="bg-black/20 backdrop-blur-sm border-white/10">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg font-semibold">
                            <div className="p-2 bg-orange-500/20 rounded-lg mr-3">
                              <Code className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
                            </div>
                            Skills
                            <span className="ml-2 text-white/50 text-sm font-normal">
                              ({parsedData.skills.length})
                            </span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {parsedData.skills.map((skill, index) => {
                              const skillText = typeof skill === "string" ? skill : skill.name || JSON.stringify(skill);
                              return skillText && skillText.trim() !== "" ? (
                                <span
                                  key={index}
                                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-800 border border-orange-500/30 rounded-full text-white text-xs sm:text-sm font-medium hover:bg-gray-700 transition-all"
                                >
                                  {skillText}
                                </span>
                              ) : null;
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Derived Skills */}
                    {hasValidSkills(parsedData.derived_skills) && (
                      <Card className="bg-black/20 backdrop-blur-sm border-red-500/20">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg font-semibold">
                            <div className="p-2 bg-red-500/20 rounded-lg mr-3">
                              <Brain className="w-5 h-5 text-red-400" />
                            </div>
                            Derived Skills ({parsedData.derived_skills.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {parsedData.derived_skills.map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-800 border border-cyan-500/30 rounded-full text-cyan-200 text-xs sm:text-sm font-medium hover:bg-gray-700 transition-all"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Projects */}
                    {hasValidItems(parsedData.projects) && (
                      <Card className="bg-black/20 backdrop-blur-sm border-white/10">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg font-semibold">
                            <div className="p-2 bg-cyan-500/20 rounded-lg mr-3">
                              <Award className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
                            </div>
                            Projects
                            <span className="ml-2 text-white/50 text-sm font-normal">
                              ({parsedData.projects.length})
                            </span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {parsedData.projects.map((project, index) => (
                              <div
                                key={index}
                                className="p-4 sm:p-5 bg-gray-900/50 rounded-lg border border-cyan-500/10 hover:border-cyan-500/30 transition-all"
                              >
                                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-2 mb-3">
                                  <div className="flex-1">
                                    {project.Name && <h4 className="text-white font-semibold text-base sm:text-lg mb-2">{project.Name}</h4>}
                                  </div>
                                  {project.Date && (
                                    <div className="flex items-center gap-2 text-cyan-200 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
                                      <Calendar className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                                      <span className="text-xs sm:text-sm">{project.Date}</span>
                                    </div>
                                  )}
                                </div>
                                {project.Description && <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-3">{project.Description}</p>}
                                {project["Tech Stack"] && (
                                  <div className="mt-3">
                                    <h4 className="text-white/80 text-sm font-semibold mb-2">Technologies Used:</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {(typeof project["Tech Stack"] === "string" ? project["Tech Stack"].split(",") : [project["Tech Stack"]]).map((tech, i) => (
                                        <span key={i} className="px-3 py-1 bg-gray-800 border border-cyan-500/20 rounded-full text-cyan-300 text-xs font-medium">
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

                    {/* Achievements */}
                    {hasValidItems(parsedData.achievements) && (
                      <Card className="bg-black/20 backdrop-blur-sm border-yellow-500/20">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg font-semibold">
                            <div className="p-2 bg-yellow-500/20 rounded-lg mr-3">
                              <Trophy className="w-5 h-5 text-yellow-400" />
                            </div>
                            Achievements ({parsedData.achievements.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {parsedData.achievements.map((achievement, idx) => (
                              <div key={idx} className="p-3 bg-gray-900/50 rounded-lg border border-yellow-500/10">
                                {achievement.Title && <h4 className="text-white font-semibold text-sm mb-1">{achievement.Title}</h4>}
                                {achievement.Description && <p className="text-gray-300 text-sm">{achievement.Description}</p>}
                                {achievement.Date && <p className="text-white/50 text-xs mt-1">{achievement.Date}</p>}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Publications */}
                    {hasValidItems(parsedData.publications) && (
                      <Card className="bg-black/20 backdrop-blur-sm border-blue-500/20">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg font-semibold">
                            <div className="p-2 bg-blue-500/20 rounded-lg mr-3">
                              <FileText className="w-5 h-5 text-blue-400" />
                            </div>
                            Publications ({parsedData.publications.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {parsedData.publications.map((pub, idx) => (
                              <div key={idx} className="p-3 bg-gray-900/50 rounded-lg border border-blue-500/10">
                                {pub.Title && <h4 className="text-white font-semibold text-sm mb-1">{pub.Title}</h4>}
                                {pub.Authors && <p className="text-gray-300 text-sm">Authors: {pub.Authors}</p>}
                                {pub["Journal/Conference"] && <p className="text-gray-300 text-sm">{pub["Journal/Conference"]}</p>}
                                <div className="flex gap-4 text-xs text-white/50 mt-2">
                                  {pub.Date && <span>{pub.Date}</span>}
                                  {pub["DOI/Link"] && (
                                    <a href={pub["DOI/Link"]} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
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
                    {hasValidItems(parsedData.research) && (
                      <Card className="bg-black/20 backdrop-blur-sm border-teal-500/20">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg font-semibold">
                            <div className="p-2 bg-teal-500/20 rounded-lg mr-3">
                              <BookOpen className="w-5 h-5 text-teal-400" />
                            </div>
                            Research Experience ({parsedData.research.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {parsedData.research.map((research, idx) => (
                              <div key={idx} className="p-3 bg-gray-900/50 rounded-lg border border-teal-500/10">
                                {research.Title && research.Title.trim() !== "" && <h4 className="text-white font-semibold text-sm mb-1">{research.Title}</h4>}
                                {research.Description && research.Description.trim() !== "" && <p className="text-gray-300 text-sm mb-2">{research.Description}</p>}
                                <div className="flex gap-3 text-xs text-white/60">
                                  {research.Institution && research.Institution.trim() !== "" && <span>{research.Institution}</span>}
                                  {research.Duration && research.Duration.trim() !== "" && <span>{research.Duration}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Certifications */}
                    {hasValidItems(parsedData.certifications) && (
                      <Card className="bg-black/20 backdrop-blur-sm border-green-500/20">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg font-semibold">
                            <div className="p-2 bg-green-500/20 rounded-lg mr-3">
                              <FileCheck className="w-5 h-5 text-green-400" />
                            </div>
                            Certifications ({parsedData.certifications.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {parsedData.certifications.map((cert, idx) => (
                              <div key={idx} className="p-3 bg-gray-900/50 rounded-lg border border-green-500/10">
                                {cert.Name && <h4 className="text-white font-semibold text-sm mb-1">{cert.Name}</h4>}
                                {cert.Issuer && <p className="text-gray-300 text-sm">{cert.Issuer}</p>}
                                <div className="flex gap-3 text-xs text-white/50 mt-1">
                                  {cert.Date && <span>Issued: {cert.Date}</span>}
                                  {cert.Validity && <span>Valid: {cert.Validity}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Awards */}
                    {hasValidItems(parsedData.awards) && (
                      <Card className="bg-black/20 backdrop-blur-sm border-red-500/20">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg font-semibold">
                            <div className="p-2 bg-red-500/20 rounded-lg mr-3">
                              <Trophy className="w-5 h-5 text-red-400" />
                            </div>
                            Awards & Honors ({parsedData.awards.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {parsedData.awards.map((award, idx) => (
                              <div key={idx} className="p-3 bg-gray-900/50 rounded-lg border border-red-500/10">
                                {award.Title && <h4 className="text-white font-semibold text-sm mb-1">{award.Title}</h4>}
                                {award.Issuer && <p className="text-gray-300 text-sm">{award.Issuer}</p>}
                                {award.Description && <p className="text-gray-300 text-sm mt-1">{award.Description}</p>}
                                {award.Date && <p className="text-white/50 text-xs mt-1">{award.Date}</p>}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Volunteer Work */}
                    {hasValidItems(parsedData.volunteer_work) && (
                      <Card className="bg-black/20 backdrop-blur-sm border-pink-500/20">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg font-semibold">
                            <div className="p-2 bg-pink-500/20 rounded-lg mr-3">
                              <Heart className="w-5 h-5 text-pink-400" />
                            </div>
                            Volunteer Experience ({parsedData.volunteer_work.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {parsedData.volunteer_work.map((vol, idx) => (
                              <div key={idx} className="p-3 bg-gray-900/50 rounded-lg border border-pink-500/10">
                                {vol.Role && <h4 className="text-white font-semibold text-sm mb-1">{vol.Role}</h4>}
                                {vol.Organization && <p className="text-gray-300 text-sm">{vol.Organization}</p>}
                                {vol.Duration && <p className="text-white/60 text-sm">{vol.Duration}</p>}
                                {vol.Description && <p className="text-white/70 text-sm leading-relaxed">{vol.Description}</p>}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Extracurricular Activities */}
                    {hasValidItems(parsedData.extracurricular_activities) && (
                      <Card className="bg-black/20 backdrop-blur-sm border-lime-500/20">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg font-semibold">
                            <div className="p-2 bg-lime-500/20 rounded-lg mr-3">
                              <Activity className="w-5 h-5 text-lime-400" />
                            </div>
                            Extracurricular Activities ({parsedData.extracurricular_activities.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {parsedData.extracurricular_activities.map((activity, idx) => (
                              <div key={idx} className="p-3 bg-gray-900/50 rounded-lg border border-lime-500/10">
                                {activity.Activity && <h4 className="text-white font-semibold text-sm mb-1">{activity.Activity}</h4>}
                                {activity.Role && <p className="text-gray-300 text-sm">{activity.Role}</p>}
                                {activity.Duration && <p className="text-white/60 text-sm">{activity.Duration}</p>}
                                {activity.Description && <p className="text-white/70 text-sm">{activity.Description}</p>}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Languages */}
                    {hasValidLanguages(parsedData.languages) && (
                      <Card className="bg-black/20 backdrop-blur-sm border-violet-500/20">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg font-semibold">
                            <div className="p-2 bg-violet-500/20 rounded-lg mr-3">
                              <Languages className="w-5 h-5 text-violet-400" />
                            </div>
                            Languages ({parsedData.languages.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {parsedData.languages.map((lang, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 bg-gray-900/50 rounded border border-violet-500/10">
                                <span className="text-white text-sm">{lang.Language}</span>
                                {lang.Proficiency && lang.Proficiency.trim() !== "" && (
                                  <span className="px-2 py-0.5 bg-violet-500/20 rounded text-violet-300 text-xs">{lang.Proficiency}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Interests */}
                    {hasValidSkills(parsedData.interests) && (
                      <Card className="bg-black/20 backdrop-blur-sm border-fuchsia-500/20">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg font-semibold">
                            <div className="p-2 bg-fuchsia-500/20 rounded-lg mr-3">
                              <Sparkles className="w-5 h-5 text-fuchsia-400" />
                            </div>
                            Interests & Hobbies ({parsedData.interests.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {parsedData.interests.map((interest, idx) => (
                              <span key={idx} className="px-3 py-1 bg-fuchsia-500/20 border border-fuchsia-500/20 rounded-full text-white text-xs">
                                {interest}
                              </span>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Hobbies */}
                    {hasValidSkills(parsedData.hobbies) && (
                      <Card className="bg-black/20 backdrop-blur-sm border-indigo-500/20">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg font-semibold">
                            <div className="p-2 bg-indigo-500/20 rounded-lg mr-3">
                              <Star className="w-5 h-5 text-indigo-400" />
                            </div>
                            Hobbies ({parsedData.hobbies.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {parsedData.hobbies.map((hobby, idx) => (
                              <span key={idx} className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/20 rounded-full text-white text-xs">
                                {hobby}
                              </span>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* References */}
                    {hasValidItems(parsedData.references) && (
                      <Card className="bg-black/20 backdrop-blur-sm border-slate-500/20">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg font-semibold">
                            <div className="p-2 bg-slate-500/20 rounded-lg mr-3">
                              <User className="w-5 h-5 text-slate-400" />
                            </div>
                            References ({parsedData.references.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {parsedData.references.map((ref, idx) => (
                              <div key={idx} className="p-3 bg-gray-900/50 rounded-lg border border-slate-500/10">
                                {ref.Name && <h4 className="text-white font-semibold text-sm mb-1">{ref.Name}</h4>}
                                {ref.Title && <p className="text-gray-300 text-sm">{ref.Title}</p>}
                                {ref.Relationship && <p className="text-white/60 text-sm">{ref.Relationship}</p>}
                                {ref.Contact && <p className="text-white/70 text-sm">{ref.Contact}</p>}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Social & Professional Links */}
                    {(parsedData.linkedin_url || parsedData.github_url || parsedData.portfolio_url || parsedData.personal_website) && (
                      <Card className="bg-black/20 backdrop-blur-sm border-sky-500/20">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg font-semibold">
                            <div className="p-2 bg-sky-500/20 rounded-lg mr-3">
                              <LinkIcon className="w-5 h-5 text-sky-400" />
                            </div>
                            Social & Professional Links
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {parsedData.linkedin_url && (
                              <a href={parsedData.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg hover:bg-gray-800 transition-all border border-sky-500/10">
                                <Linkedin className="w-5 h-5 text-sky-400 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-white/50 text-xs mb-1">LinkedIn</p>
                                  <p className="text-white text-sm truncate">{parsedData.linkedin_url}</p>
                                </div>
                                <ExternalLink className="w-4 h-4 text-sky-400 flex-shrink-0" />
                              </a>
                            )}
                            {parsedData.github_url && (
                              <a href={parsedData.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg hover:bg-gray-800 transition-all border border-sky-500/10">
                                <Github className="w-5 h-5 text-sky-400 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-white/50 text-xs mb-1">GitHub</p>
                                  <p className="text-white text-sm truncate">{parsedData.github_url}</p>
                                </div>
                                <ExternalLink className="w-4 h-4 text-sky-400 flex-shrink-0" />
                              </a>
                            )}
                            {parsedData.portfolio_url && (
                              <a href={parsedData.portfolio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg hover:bg-gray-800 transition-all border border-sky-500/10">
                                <Briefcase className="w-5 h-5 text-sky-400 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-white/50 text-xs mb-1">Portfolio</p>
                                  <p className="text-white text-sm truncate">{parsedData.portfolio_url}</p>
                                </div>
                                <ExternalLink className="w-4 h-4 text-sky-400 flex-shrink-0" />
                              </a>
                            )}
                            {parsedData.personal_website && (
                              <a href={parsedData.personal_website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg hover:bg-gray-800 transition-all border border-sky-500/10">
                                <Globe className="w-5 h-5 text-sky-400 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-white/50 text-xs mb-1">Personal Website</p>
                                  <p className="text-white text-sm truncate">{parsedData.personal_website}</p>
                                </div>
                                <ExternalLink className="w-4 h-4 text-sky-400 flex-shrink-0" />
                              </a>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Career Preferences */}
                    {(parsedData.placement_preferences || parsedData.preferred_job_role || parsedData.preferred_industry) && (
                      <Card className="bg-black/20 backdrop-blur-sm border-orange-500/20">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg font-semibold">
                            <div className="p-2 bg-orange-500/20 rounded-lg mr-3">
                              <Target className="w-5 h-5 text-orange-400" />
                            </div>
                            Career Preferences
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {parsedData.placement_preferences && (
                              <div className="flex items-start gap-3 p-3 bg-gray-900/50 border border-white/5 rounded-lg">
                                <Briefcase className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-white/50 text-xs sm:text-sm mb-1">Placement Preferences</p>
                                  <p className="text-white font-medium text-sm sm:text-base">{parsedData.placement_preferences}</p>
                                </div>
                              </div>
                            )}
                            {parsedData.preferred_job_role && (
                              <div className="flex items-start gap-3 p-3 bg-gray-900/50 border border-white/5 rounded-lg">
                                <Target className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-white/50 text-xs sm:text-sm mb-1">Preferred Job Role</p>
                                  <p className="text-white font-medium text-sm sm:text-base">{parsedData.preferred_job_role}</p>
                                </div>
                              </div>
                            )}
                            {parsedData.preferred_industry && (
                              <div className="flex items-start gap-3 p-3 bg-gray-900/50 border border-white/5 rounded-lg">
                                <Building2 className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-white/50 text-xs sm:text-sm mb-1">Preferred Industry</p>
                                  <p className="text-white font-medium text-sm sm:text-base">{parsedData.preferred_industry}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Extra Sections */}
                    {parsedData.extra_sections && Object.keys(parsedData.extra_sections).length > 0 && (
                      <Card className="bg-black/20 backdrop-blur-sm border-amber-500/20">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg font-semibold">
                            <div className="p-2 bg-amber-500/20 rounded-lg mr-3">
                              <Plus className="w-5 h-5 text-amber-400" />
                            </div>
                            Additional Information ({Object.keys(parsedData.extra_sections).length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {Object.entries(parsedData.extra_sections).map(([sectionName, sectionData], idx) => (
                            <div key={idx} className="p-3 bg-gray-900/50 rounded-lg border border-amber-500/10">
                              <h4 className="text-white font-semibold text-sm mb-2">{sectionName}</h4>
                              <div className="space-y-2">
                                {Array.isArray(sectionData) ? (
                                  sectionData.map((item, itemIdx) => (
                                    <div key={itemIdx} className="text-sm text-white/70 pl-3 border-l-2 border-amber-500/20">
                                      {typeof item === "object" ? (
                                        <div className="space-y-1">
                                          {Object.entries(item).map(([key, value]) => (
                                            <div key={key}>
                                              <span className="font-medium text-white/80">{key}:</span> {value}
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <span>{item}</span>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-sm text-white/70">{JSON.stringify(sectionData)}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* Failed parses */}
        {failed.length > 0 && (
          <div className="mt-8">
            <Card className="bg-red-950/30 backdrop-blur-sm border-red-500/20">
              <CardHeader>
                <CardTitle className="flex items-center text-red-400 text-lg">
                  Failed to Parse ({failed.length} file{failed.length !== 1 ? "s" : ""})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {failed.map((f, i) => (
                    <div key={i} className="p-3 bg-red-950/50 rounded text-red-200 border border-red-900/50">
                      <div className="font-medium">{f.filename}</div>
                      <div className="text-sm text-red-300">{f.error}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruiterBulkResults;