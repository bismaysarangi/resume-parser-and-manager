import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  FileText,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  Code,
  Brain,
  Calendar,
  Building2,
  Target,
  ExternalLink,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const ParsedResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { parsedData, fileName } = location.state || {};

  // Debug: Log the parsed data to see its structure
  console.log("Parsed Data:", parsedData);

  if (!parsedData) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "rgb(34, 24, 36)" }}
      >
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <FileText className="w-16 h-16 text-white/60 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">
              No Data Found
            </h2>
            <p className="text-white/70 mb-6">Please upload a resume first.</p>
            <Link to="/candidate/upload">
              <Button className="bg-white text-black hover:bg-white/90">
                Go to Upload
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Improved helper function to check if array has valid items
  const hasValidItems = (array) => {
    if (!array || !Array.isArray(array) || array.length === 0) return false;

    // Check if any item in the array has at least one non-empty property
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

  return (
    <div
      className="min-h-screen pt-16" // Added pt-16 to account for navbar height
      style={{ backgroundColor: "rgb(34, 24, 36)" }}
    >
      {/* Main content with proper top padding */}
      <div className="container mx-auto max-w-7xl py-6 sm:py-8 px-4 sm:px-6 mt-4">
        {" "}
        {/* Added mt-4 */}
        <div className="space-y-6">
          {/* Personal Information */}
          {(parsedData.name || parsedData.email || parsedData.phone) && (
            <Card className="bg-gradient-to-br from-blue-600/10 to-cyan-600/5 backdrop-blur-sm border-blue-500/20 hover:border-blue-400/30 transition-all">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-white text-lg sm:text-xl">
                  <div className="p-2 bg-blue-500/20 rounded-lg mr-3">
                    <User className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                  </div>
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {parsedData.name && (
                    <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                      <User className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-white/60 text-xs sm:text-sm mb-1">
                          Full Name
                        </p>
                        <p className="text-white font-medium text-sm sm:text-base break-words">
                          {parsedData.name}
                        </p>
                      </div>
                    </div>
                  )}
                  {parsedData.email && (
                    <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                      <Mail className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-white/60 text-xs sm:text-sm mb-1">
                          Email Address
                        </p>
                        <p className="text-white font-medium text-sm sm:text-base break-words">
                          {parsedData.email}
                        </p>
                      </div>
                    </div>
                  )}
                  {parsedData.phone && (
                    <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                      <Phone className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-white/60 text-xs sm:text-sm mb-1">
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
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:border-white/30 transition-all">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-white text-lg sm:text-xl">
                  <div className="p-2 bg-indigo-500/20 rounded-lg mr-3">
                    <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
                  </div>
                  Education
                  <span className="ml-2 text-white/60 text-sm font-normal">
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
                      className="p-4 sm:p-5 bg-gradient-to-br from-indigo-500/5 to-blue-500/5 rounded-lg border border-indigo-500/10 hover:border-indigo-400/20 transition-all"
                    >
                      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-2 mb-3">
                        <div className="flex-1">
                          {edu.Degree && (
                            <h3 className="text-white font-semibold text-base sm:text-lg mb-1">
                              {edu.Degree}
                            </h3>
                          )}
                          {edu.University && (
                            <p className="text-white/80 text-sm sm:text-base mb-2">
                              {edu.University}
                            </p>
                          )}
                          {(edu.Grade || edu.Years) && (
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
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-white/60 text-lg sm:text-xl">
                  <div className="p-2 bg-gray-500/20 rounded-lg mr-3">
                    <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                  </div>
                  Education
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/40 text-center py-4">
                  No education data found in the resume
                </p>
              </CardContent>
            </Card>
          )}

          {/* Work Experience */}
          {hasValidItems(parsedData.experience) ? (
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:border-white/30 transition-all">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-white text-lg sm:text-xl">
                  <div className="p-2 bg-green-500/20 rounded-lg mr-3">
                    <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                  </div>
                  Work Experience
                  <span className="ml-2 text-white/60 text-sm font-normal">
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
                      className="p-4 sm:p-5 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-lg border border-green-500/10 hover:border-green-400/20 transition-all"
                    >
                      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-2 mb-3">
                        <div className="flex-1">
                          {exp.Role && (
                            <h3 className="text-white font-semibold text-base sm:text-lg mb-1">
                              {exp.Role}
                            </h3>
                          )}
                          {exp.Company && (
                            <div className="flex items-center gap-2 text-white/80 mb-2">
                              <Building2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                              <span className="text-sm sm:text-base">
                                {exp.Company}
                              </span>
                            </div>
                          )}
                        </div>
                        {exp.Years && (
                          <div className="flex items-center gap-2 text-white/60 bg-green-500/10 px-3 py-1 rounded-full">
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
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-white/60 text-lg sm:text-xl">
                  <div className="p-2 bg-gray-500/20 rounded-lg mr-3">
                    <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                  </div>
                  Work Experience
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/40 text-center py-4">
                  No work experience data found in the resume
                </p>
              </CardContent>
            </Card>
          )}

          {/* Skills - FIXED: Using the special skills validation */}
          {hasValidSkills(parsedData.skills) ? (
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:border-white/30 transition-all">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-white text-lg sm:text-xl">
                  <div className="p-2 bg-orange-500/20 rounded-lg mr-3">
                    <Code className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
                  </div>
                  Skills
                  <span className="ml-2 text-white/60 text-sm font-normal">
                    ({parsedData.skills.length} skill
                    {parsedData.skills.length !== 1 ? "s" : ""})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {parsedData.skills.map((skill, index) => {
                    // Handle different skill formats
                    const skillText =
                      typeof skill === "string"
                        ? skill
                        : skill.name || JSON.stringify(skill);

                    return skillText && skillText.trim() !== "" ? (
                      <span
                        key={index}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-orange-600/20 to-red-600/20 border border-orange-500/30 rounded-full text-white text-xs sm:text-sm font-medium hover:border-orange-400/50 hover:scale-105 transition-all"
                      >
                        {skillText}
                      </span>
                    ) : null;
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-white/60 text-lg sm:text-xl">
                  <div className="p-2 bg-gray-500/20 rounded-lg mr-3">
                    <Code className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                  </div>
                  Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/40 text-center py-4">
                  No skills data found in the resume
                </p>
              </CardContent>
            </Card>
          )}

          {/* Projects */}
          {hasValidItems(parsedData.projects) ? (
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:border-white/30 transition-all">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-white text-lg sm:text-xl">
                  <div className="p-2 bg-cyan-500/20 rounded-lg mr-3">
                    <Award className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
                  </div>
                  Projects
                  <span className="ml-2 text-white/60 text-sm font-normal">
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
                      className="p-4 sm:p-5 bg-gradient-to-br from-cyan-500/5 to-teal-500/5 rounded-lg border border-cyan-500/10 hover:border-cyan-400/20 transition-all"
                    >
                      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-2 mb-3">
                        <div className="flex-1">
                          {project.Name && (
                            <h3 className="text-white font-semibold text-base sm:text-lg mb-2">
                              {project.Name}
                            </h3>
                          )}
                        </div>
                        {project.Date && (
                          <div className="flex items-center gap-2 text-white/60 bg-cyan-500/10 px-3 py-1 rounded-full">
                            <Calendar className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                            <span className="text-xs sm:text-sm">
                              {project.Date}
                            </span>
                          </div>
                        )}
                      </div>

                      {project.Description && (
                        <p className="text-white/70 text-sm sm:text-base leading-relaxed mb-3">
                          {project.Description}
                        </p>
                      )}

                      {project["Tech Stack"] && (
                        <div className="mt-3">
                          <h4 className="text-white/80 text-sm font-semibold mb-2">
                            Technologies Used:
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {(typeof project["Tech Stack"] === "string"
                              ? project["Tech Stack"].split(",")
                              : [project["Tech Stack"]]
                            ).map((tech, i) => (
                              <span
                                key={i}
                                className="px-3 py-1 bg-cyan-500/20 rounded-full text-cyan-300 text-xs font-medium"
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
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-white/60 text-lg sm:text-xl">
                  <div className="p-2 bg-gray-500/20 rounded-lg mr-3">
                    <Award className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                  </div>
                  Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/40 text-center py-4">
                  No projects data found in the resume
                </p>
              </CardContent>
            </Card>
          )}

          {/* Academic Marks */}
          {(parsedData["10th Marks"] || parsedData["12th Marks"]) && (
            <Card className="bg-gradient-to-br from-purple-600/10 to-pink-600/5 backdrop-blur-sm border-purple-500/20 hover:border-purple-400/30 transition-all">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-white text-lg sm:text-xl">
                  <div className="p-2 bg-purple-500/20 rounded-lg mr-3">
                    <Award className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                  </div>
                  Academic Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {parsedData["10th Marks"] && (
                    <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                      <Award className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-white/60 text-xs sm:text-sm mb-1">
                          10th Grade Marks
                        </p>
                        <p className="text-white font-medium text-sm sm:text-base">
                          {parsedData["10th Marks"]}
                        </p>
                      </div>
                    </div>
                  )}
                  {parsedData["12th Marks"] && (
                    <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                      <Award className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-white/60 text-xs sm:text-sm mb-1">
                          12th Grade Marks
                        </p>
                        <p className="text-white font-medium text-sm sm:text-base">
                          {parsedData["12th Marks"]}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        {/* Action Button */}
        <div className="mt-8 text-center">
          <Button
            size="lg"
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-base sm:text-lg font-semibold w-full sm:w-auto"
            onClick={() =>
              navigate("/ai-insights", { state: { parsedData, fileName } })
            }
          >
            <Brain className="w-5 h-5 mr-2" />
            Get AI-Powered Insights
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ParsedResults;
