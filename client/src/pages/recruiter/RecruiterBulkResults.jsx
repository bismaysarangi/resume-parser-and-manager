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
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

// Improved helper function to check if array has valid items
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

// Special function for skills since it's an array of strings
const hasValidSkills = (skills) => {
  return (
    skills &&
    Array.isArray(skills) &&
    skills.length > 0 &&
    skills.some((skill) => skill && skill.trim() !== "")
  );
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <div className="w-32"></div> {/* Spacer for centering */}
        </div>

        <div className="space-y-6">
          {successful.map((item, idx) => {
            const parsedData = item.data || item.parsed_data || {};
            const name = parsedData.name || "Unknown Candidate";

            // Get both regular skills and derived skills
            const regularSkills = parsedData.skills || [];
            const derivedSkills = parsedData.derived_skills || [];
            const hasAnySkills =
              hasValidSkills(regularSkills) || hasValidSkills(derivedSkills);

            return (
              <Card
                key={idx}
                // Changed from bg-white/10 to bg-gray-900/40 (Darker background)
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
                    {(parsedData.name ||
                      parsedData.email ||
                      parsedData.phone) && (
                      // Darker background for section card
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
                              // Very dark background for individual items
                              <div className="flex items-start gap-3 p-3 bg-gray-900/50 border border-white/5 rounded-lg">
                                <User className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-white/50 text-xs sm:text-sm mb-1">
                                    Full Name
                                  </p>
                                  <p className="text-white font-medium text-sm sm:text-base break-words">
                                    {parsedData.name}
                                  </p>
                                </div>
                              </div>
                            )}
                            {parsedData.email && (
                              <div className="flex items-start gap-3 p-3 bg-gray-900/50 border border-white/5 rounded-lg">
                                <Mail className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-white/50 text-xs sm:text-sm mb-1">
                                    Email Address
                                  </p>
                                  <p className="text-white font-medium text-sm sm:text-base break-words">
                                    {parsedData.email}
                                  </p>
                                </div>
                              </div>
                            )}
                            {parsedData.phone && (
                              <div className="flex items-start gap-3 p-3 bg-gray-900/50 border border-white/5 rounded-lg">
                                <Phone className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-white/50 text-xs sm:text-sm mb-1">
                                    Phone Number
                                  </p>
                                  <p className="text-white font-medium text-sm sm:text-base">
                                    {parsedData.phone}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Education */}
                    {hasValidItems(parsedData.education) ? (
                      <Card className="bg-black/20 backdrop-blur-sm border-white/10">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg font-semibold">
                            <div className="p-2 bg-indigo-500/20 rounded-lg mr-3">
                              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
                            </div>
                            Education
                            <span className="ml-2 text-white/50 text-sm font-normal">
                              ({parsedData.education.length} institution
                              {parsedData.education.length !== 1 ? "s" : ""})
                            </span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {parsedData.education.map((edu, index) => (
                              <div
                                key={index}
                                // Dark gray background for list items
                                className="p-4 sm:p-5 bg-gray-900/50 rounded-lg border border-indigo-500/10 hover:border-indigo-500/30 transition-all"
                              >
                                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-2 mb-3">
                                  <div className="flex-1">
                                    {edu.Degree && (
                                      <h4 className="text-white font-semibold text-base sm:text-lg mb-1">
                                        {edu.Degree}
                                      </h4>
                                    )}
                                    {edu.University && (
                                      <p className="text-gray-300 text-sm sm:text-base mb-2">
                                        {edu.University}
                                      </p>
                                    )}
                                    {(edu.Grade || edu.Years) && (
                                      <div className="flex flex-wrap gap-4 mt-2">
                                        {edu.Grade && (
                                          <span className="text-white/60 text-sm">
                                            Grade: {edu.Grade}
                                          </span>
                                        )}
                                        {edu.Years && (
                                          <span className="text-white/60 text-sm">
                                            Years: {edu.Years}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="bg-black/20 backdrop-blur-sm border-white/10">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white/50 text-lg font-semibold">
                            <div className="p-2 bg-gray-800/50 rounded-lg mr-3">
                              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                            </div>
                            Education
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-white/30 text-center py-4">
                            No education data found
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Work Experience */}
                    {hasValidItems(parsedData.experience) ? (
                      <Card className="bg-black/20 backdrop-blur-sm border-white/10">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg font-semibold">
                            <div className="p-2 bg-green-500/20 rounded-lg mr-3">
                              <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                            </div>
                            Work Experience
                            <span className="ml-2 text-white/50 text-sm font-normal">
                              ({parsedData.experience.length} position
                              {parsedData.experience.length !== 1 ? "s" : ""})
                            </span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {parsedData.experience.map((exp, index) => (
                              <div
                                key={index}
                                // Dark gray background
                                className="p-4 sm:p-5 bg-gray-900/50 rounded-lg border border-green-500/10 hover:border-green-500/30 transition-all"
                              >
                                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-2 mb-3">
                                  <div className="flex-1">
                                    {exp.Role && (
                                      <h4 className="text-white font-semibold text-base sm:text-lg mb-1">
                                        {exp.Role}
                                      </h4>
                                    )}
                                    {exp.Company && (
                                      <div className="flex items-center gap-2 text-gray-300 mb-2">
                                        <Building2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                                        <span className="text-sm sm:text-base">
                                          {exp.Company}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  {exp.Years && (
                                    <div className="flex items-center gap-2 text-white/70 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                                      <Calendar className="w-4 h-4 text-green-400 flex-shrink-0" />
                                      <span className="text-xs sm:text-sm whitespace-nowrap">
                                        {exp.Years}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="bg-black/20 backdrop-blur-sm border-white/10">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white/50 text-lg font-semibold">
                            <div className="p-2 bg-gray-800/50 rounded-lg mr-3">
                              <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                            </div>
                            Work Experience
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-white/30 text-center py-4">
                            No work experience data found
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Enhanced Skills Section */}
                    {hasAnySkills ? (
                      <Card className="bg-black/20 backdrop-blur-sm border-white/10">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg font-semibold">
                            <div className="p-2 bg-orange-500/20 rounded-lg mr-3">
                              <Code className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
                            </div>
                            Skills & Technologies
                            <span className="ml-2 text-white/50 text-sm font-normal">
                              ({regularSkills.length + derivedSkills.length}{" "}
                              total)
                            </span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Regular Skills */}
                          {hasValidSkills(regularSkills) && (
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <Code className="w-4 h-4 text-orange-400" />
                                <h4 className="text-white/90 text-sm font-semibold">
                                  Listed Skills
                                </h4>
                                <span className="text-white/40 text-xs">
                                  ({regularSkills.length})
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {regularSkills.map((skill, index) => {
                                  const skillText =
                                    typeof skill === "string"
                                      ? skill
                                      : skill.name || JSON.stringify(skill);
                                  return skillText &&
                                    skillText.trim() !== "" ? (
                                    <span
                                      key={index}
                                      className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-800 border border-orange-500/30 rounded-full text-white text-xs sm:text-sm font-medium hover:bg-gray-700 transition-all"
                                    >
                                      {skillText}
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          )}

                          {/* Derived Skills */}
                          {hasValidSkills(derivedSkills) && (
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="w-4 h-4 text-cyan-400" />
                                <h4 className="text-white/90 text-sm font-semibold">
                                  Derived from Projects & Experience
                                </h4>
                                <span className="text-white/40 text-xs">
                                  ({derivedSkills.length})
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {derivedSkills.map((skill, index) => {
                                  const skillText =
                                    typeof skill === "string"
                                      ? skill
                                      : skill.name || JSON.stringify(skill);
                                  return skillText &&
                                    skillText.trim() !== "" ? (
                                    <span
                                      key={index}
                                      className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-800 border border-cyan-500/30 rounded-full text-cyan-200 text-xs sm:text-sm font-medium hover:bg-gray-700 transition-all"
                                    >
                                      {skillText}
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="bg-black/20 backdrop-blur-sm border-white/10">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white/50 text-lg font-semibold">
                            <div className="p-2 bg-gray-800/50 rounded-lg mr-3">
                              <Code className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                            </div>
                            Skills
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-white/30 text-center py-4">
                            No skills data found
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Projects */}
                    {hasValidItems(parsedData.projects) ? (
                      <Card className="bg-black/20 backdrop-blur-sm border-white/10">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg font-semibold">
                            <div className="p-2 bg-cyan-500/20 rounded-lg mr-3">
                              <Award className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
                            </div>
                            Projects
                            <span className="ml-2 text-white/50 text-sm font-normal">
                              ({parsedData.projects.length} project
                              {parsedData.projects.length !== 1 ? "s" : ""})
                            </span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {parsedData.projects.map((project, index) => (
                              <div
                                key={index}
                                // Dark gray background
                                className="p-4 sm:p-5 bg-gray-900/50 rounded-lg border border-cyan-500/10 hover:border-cyan-500/30 transition-all"
                              >
                                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-2 mb-3">
                                  <div className="flex-1">
                                    {project.Name && (
                                      <h4 className="text-white font-semibold text-base sm:text-lg mb-2">
                                        {project.Name}
                                      </h4>
                                    )}
                                  </div>
                                  {project.Date && (
                                    <div className="flex items-center gap-2 text-cyan-200 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
                                      <Calendar className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                                      <span className="text-xs sm:text-sm">
                                        {project.Date}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {project.Description && (
                                  <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-3">
                                    {project.Description}
                                  </p>
                                )}

                                {project["Tech Stack"] && (
                                  <div className="mt-3">
                                    <h4 className="text-white/80 text-sm font-semibold mb-2">
                                      Technologies Used:
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                      {(typeof project["Tech Stack"] ===
                                      "string"
                                        ? project["Tech Stack"].split(",")
                                        : [project["Tech Stack"]]
                                      ).map((tech, i) => (
                                        <span
                                          key={i}
                                          className="px-3 py-1 bg-gray-800 border border-cyan-500/20 rounded-full text-cyan-300 text-xs font-medium"
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
                    ) : (
                      <Card className="bg-black/20 backdrop-blur-sm border-white/10">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white/50 text-lg font-semibold">
                            <div className="p-2 bg-gray-800/50 rounded-lg mr-3">
                              <Award className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                            </div>
                            Projects
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-white/30 text-center py-4">
                            No projects data found
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Achievements */}
                    {hasValidItems(parsedData.achievements) && (
                      <Card className="bg-black/20 backdrop-blur-sm border-white/10">
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
                              <div
                                key={idx}
                                className="p-3 bg-gray-900/50 rounded-lg border border-yellow-500/10"
                              >
                                {achievement.Title && (
                                  <h4 className="text-white font-semibold text-sm mb-1">
                                    {achievement.Title}
                                  </h4>
                                )}
                                {achievement.Description && (
                                  <p className="text-gray-300 text-sm">
                                    {achievement.Description}
                                  </p>
                                )}
                                {achievement.Date && (
                                  <p className="text-white/50 text-xs mt-1">
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
                    {hasValidItems(parsedData.publications) && (
                      <Card className="bg-black/20 backdrop-blur-sm border-white/10">
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
                              <div
                                key={idx}
                                className="p-3 bg-gray-900/50 rounded-lg border border-blue-500/10"
                              >
                                {pub.Title && (
                                  <h4 className="text-white font-semibold text-sm mb-1">
                                    {pub.Title}
                                  </h4>
                                )}
                                {pub.Authors && (
                                  <p className="text-gray-300 text-sm">
                                    Authors: {pub.Authors}
                                  </p>
                                )}
                                {pub["Journal/Conference"] && (
                                  <p className="text-gray-300 text-sm">
                                    {pub["Journal/Conference"]}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Research */}
                    {hasValidItems(parsedData.research) && (
                      <Card className="bg-black/20 backdrop-blur-sm border-white/10">
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
                              <div
                                key={idx}
                                className="p-3 bg-gray-900/50 rounded-lg border border-teal-500/10"
                              >
                                {research.Title && (
                                  <h4 className="text-white font-semibold text-sm mb-1">
                                    {research.Title}
                                  </h4>
                                )}
                                {research.Description && (
                                  <p className="text-gray-300 text-sm mb-2">
                                    {research.Description}
                                  </p>
                                )}
                                <div className="flex gap-3 text-xs text-white/60">
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
                    {hasValidItems(parsedData.certifications) && (
                      <Card className="bg-black/20 backdrop-blur-sm border-white/10">
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
                              <div
                                key={idx}
                                className="p-3 bg-gray-900/50 rounded-lg border border-green-500/10"
                              >
                                {cert.Name && (
                                  <h4 className="text-white font-semibold text-sm mb-1">
                                    {cert.Name}
                                  </h4>
                                )}
                                {cert.Issuer && (
                                  <p className="text-gray-300 text-sm">
                                    {cert.Issuer}
                                  </p>
                                )}
                                <div className="flex gap-3 text-xs text-white/50 mt-1">
                                  {cert.Date && (
                                    <span>Issued: {cert.Date}</span>
                                  )}
                                  {cert.Validity && (
                                    <span>Valid: {cert.Validity}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Awards */}
                    {hasValidItems(parsedData.awards) && (
                      <Card className="bg-black/20 backdrop-blur-sm border-white/10">
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
                              <div
                                key={idx}
                                className="p-3 bg-gray-900/50 rounded-lg border border-red-500/10"
                              >
                                {award.Title && (
                                  <h4 className="text-white font-semibold text-sm mb-1">
                                    {award.Title}
                                  </h4>
                                )}
                                {award.Issuer && (
                                  <p className="text-gray-300 text-sm">
                                    {award.Issuer}
                                  </p>
                                )}
                                {award.Description && (
                                  <p className="text-gray-300 text-sm mt-1">
                                    {award.Description}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Volunteer Work */}
                    {hasValidItems(parsedData.volunteer_work) && (
                      <Card className="bg-black/20 backdrop-blur-sm border-white/10">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg font-semibold">
                            <div className="p-2 bg-pink-500/20 rounded-lg mr-3">
                              <Heart className="w-5 h-5 text-pink-400" />
                            </div>
                            Volunteer Experience (
                            {parsedData.volunteer_work.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {parsedData.volunteer_work.map((vol, idx) => (
                              <div
                                key={idx}
                                className="p-3 bg-gray-900/50 rounded-lg border border-pink-500/10"
                              >
                                {vol.Role && (
                                  <h4 className="text-white font-semibold text-sm mb-1">
                                    {vol.Role}
                                  </h4>
                                )}
                                {vol.Organization && (
                                  <p className="text-gray-300 text-sm">
                                    {vol.Organization}
                                  </p>
                                )}
                                {vol.Duration && (
                                  <p className="text-white/60 text-sm">
                                    {vol.Duration}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Languages */}
                    {hasValidItems(parsedData.languages) && (
                      <Card className="bg-black/20 backdrop-blur-sm border-white/10">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg font-semibold">
                            <div className="p-2 bg-violet-500/20 rounded-lg mr-3">
                              <Languages className="w-5 h-5 text-violet-400" />
                            </div>
                            Languages ({parsedData.languages.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-2">
                            {parsedData.languages.map((lang, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-2 bg-gray-900/50 rounded border border-violet-500/10"
                              >
                                <span className="text-white text-sm">
                                  {lang.Language}
                                </span>
                                <span className="px-2 py-0.5 bg-violet-500/20 rounded text-violet-300 text-xs">
                                  {lang.Proficiency}
                                </span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Interests */}
                    {hasValidSkills(parsedData.interests) && (
                      <Card className="bg-black/20 backdrop-blur-sm border-white/10">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg font-semibold">
                            <div className="p-2 bg-fuchsia-500/20 rounded-lg mr-3">
                              <Sparkles className="w-5 h-5 text-fuchsia-400" />
                            </div>
                            Interests ({parsedData.interests.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {parsedData.interests.map((interest, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-fuchsia-500/20 border border-fuchsia-500/20 rounded-full text-white text-xs"
                              >
                                {interest}
                              </span>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Academic Marks */}
                    {(parsedData.tenth_marks || parsedData.twelfth_marks) && (
                      <Card className="bg-black/20 backdrop-blur-sm border-purple-500/20">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-white text-lg font-semibold">
                            <div className="p-2 bg-purple-500/20 rounded-lg mr-3">
                              <Award className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                            </div>
                            Academic Performance
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {parsedData.tenth_marks && (
                              <div className="flex items-start gap-3 p-3 bg-gray-900/50 border border-white/5 rounded-lg">
                                <Award className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-white/50 text-xs sm:text-sm mb-1">
                                    10th Grade Marks
                                  </p>
                                  <p className="text-white font-medium text-sm sm:text-base">
                                    {parsedData.tenth_marks}
                                  </p>
                                </div>
                              </div>
                            )}
                            {parsedData.twelfth_marks && (
                              <div className="flex items-start gap-3 p-3 bg-gray-900/50 border border-white/5 rounded-lg">
                                <Award className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-white/50 text-xs sm:text-sm mb-1">
                                    12th Grade Marks
                                  </p>
                                  <p className="text-white font-medium text-sm sm:text-base">
                                    {parsedData.twelfth_marks}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
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
                  Failed to Parse ({failed.length} file
                  {failed.length !== 1 ? "s" : ""})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {failed.map((f, i) => (
                    <div
                      key={i}
                      className="p-3 bg-red-950/50 rounded text-red-200 border border-red-900/50"
                    >
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
