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
  BookOpen,
  Trophy,
  Heart,
  Languages,
  Sparkles,
  Users,
  Plus,
  FileCheck,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const ParsedResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { parsedData: rawData, fileName } = location.state || {};

  // Extract the actual data - handle both nested and direct formats
  const parsedData = rawData?.data || rawData;

  // Debug: Log the parsed data to see its structure
  console.log("Raw Data:", rawData);
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
      className="min-h-screen pt-16"
      style={{ backgroundColor: "rgb(34, 24, 36)" }}
    >
      {/* Main content with proper top padding */}
      <div className="container mx-auto max-w-7xl py-6 sm:py-8 px-4 sm:px-6 mt-4">
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
                          {exp.Description && (
                            <p className="text-white/70 text-sm mt-2 leading-relaxed">
                              {exp.Description}
                            </p>
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

          {/* Skills */}
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

          {/* Achievements */}
          {hasValidItems(parsedData.achievements) && (
            <Card className="bg-gradient-to-br from-yellow-600/10 to-amber-600/5 backdrop-blur-sm border-yellow-500/20 hover:border-yellow-400/30 transition-all">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-white text-lg sm:text-xl">
                  <div className="p-2 bg-yellow-500/20 rounded-lg mr-3">
                    <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
                  </div>
                  Achievements
                  <span className="ml-2 text-white/60 text-sm font-normal">
                    ({parsedData.achievements.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {parsedData.achievements.map((achievement, index) => (
                    <div
                      key={index}
                      className="p-4 bg-white/5 rounded-lg border border-yellow-500/10"
                    >
                      {achievement.Title && (
                        <h4 className="text-white font-semibold text-base mb-1">
                          {achievement.Title}
                        </h4>
                      )}
                      {achievement.Description && (
                        <p className="text-white/70 text-sm leading-relaxed mb-2">
                          {achievement.Description}
                        </p>
                      )}
                      {achievement.Date && (
                        <p className="text-white/50 text-xs">
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
            <Card className="bg-gradient-to-br from-blue-600/10 to-indigo-600/5 backdrop-blur-sm border-blue-500/20 hover:border-blue-400/30 transition-all">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-white text-lg sm:text-xl">
                  <div className="p-2 bg-blue-500/20 rounded-lg mr-3">
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                  </div>
                  Publications
                  <span className="ml-2 text-white/60 text-sm font-normal">
                    ({parsedData.publications.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {parsedData.publications.map((pub, index) => (
                    <div
                      key={index}
                      className="p-4 bg-white/5 rounded-lg border border-blue-500/10"
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
                      <div className="flex gap-4 text-xs text-white/50 mt-2">
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
          {hasValidItems(parsedData.research) && (
            <Card className="bg-gradient-to-br from-teal-600/10 to-cyan-600/5 backdrop-blur-sm border-teal-500/20 hover:border-teal-400/30 transition-all">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-white text-lg sm:text-xl">
                  <div className="p-2 bg-teal-500/20 rounded-lg mr-3">
                    <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-teal-400" />
                  </div>
                  Research Experience
                  <span className="ml-2 text-white/60 text-sm font-normal">
                    ({parsedData.research.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {parsedData.research.map((research, index) => (
                    <div
                      key={index}
                      className="p-4 bg-white/5 rounded-lg border border-teal-500/10"
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
                      <div className="flex gap-4 text-sm text-white/60 mt-2">
                        {research.Institution && (
                          <span>{research.Institution}</span>
                        )}
                        {research.Duration && <span>{research.Duration}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Certifications */}
          {hasValidItems(parsedData.certifications) && (
            <Card className="bg-gradient-to-br from-green-600/10 to-emerald-600/5 backdrop-blur-sm border-green-500/20 hover:border-green-400/30 transition-all">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-white text-lg sm:text-xl">
                  <div className="p-2 bg-green-500/20 rounded-lg mr-3">
                    <FileCheck className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                  </div>
                  Certifications
                  <span className="ml-2 text-white/60 text-sm font-normal">
                    ({parsedData.certifications.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {parsedData.certifications.map((cert, index) => (
                    <div
                      key={index}
                      className="p-4 bg-white/5 rounded-lg border border-green-500/10"
                    >
                      {cert.Name && (
                        <h4 className="text-white font-semibold text-base mb-1">
                          {cert.Name}
                        </h4>
                      )}
                      {cert.Issuer && (
                        <p className="text-white/70 text-sm mb-2">
                          {cert.Issuer}
                        </p>
                      )}
                      <div className="flex gap-4 text-xs text-white/50 mt-1">
                        {cert.Date && <span>Issued: {cert.Date}</span>}
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
          {hasValidItems(parsedData.awards) && (
            <Card className="bg-gradient-to-br from-red-600/10 to-orange-600/5 backdrop-blur-sm border-red-500/20 hover:border-red-400/30 transition-all">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-white text-lg sm:text-xl">
                  <div className="p-2 bg-red-500/20 rounded-lg mr-3">
                    <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
                  </div>
                  Awards & Honors
                  <span className="ml-2 text-white/60 text-sm font-normal">
                    ({parsedData.awards.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {parsedData.awards.map((award, index) => (
                    <div
                      key={index}
                      className="p-4 bg-white/5 rounded-lg border border-red-500/10"
                    >
                      {award.Title && (
                        <h4 className="text-white font-semibold text-base mb-1">
                          {award.Title}
                        </h4>
                      )}
                      {award.Issuer && (
                        <p className="text-white/70 text-sm mb-1">
                          {award.Issuer}
                        </p>
                      )}
                      {award.Description && (
                        <p className="text-white/70 text-sm leading-relaxed mb-2">
                          {award.Description}
                        </p>
                      )}
                      {award.Date && (
                        <p className="text-white/50 text-xs">{award.Date}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Volunteer Work */}
          {hasValidItems(parsedData.volunteer_work) && (
            <Card className="bg-gradient-to-br from-pink-600/10 to-rose-600/5 backdrop-blur-sm border-pink-500/20 hover:border-pink-400/30 transition-all">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-white text-lg sm:text-xl">
                  <div className="p-2 bg-pink-500/20 rounded-lg mr-3">
                    <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-pink-400" />
                  </div>
                  Volunteer Experience
                  <span className="ml-2 text-white/60 text-sm font-normal">
                    ({parsedData.volunteer_work.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {parsedData.volunteer_work.map((vol, index) => (
                    <div
                      key={index}
                      className="p-4 bg-white/5 rounded-lg border border-pink-500/10"
                    >
                      {vol.Role && (
                        <h4 className="text-white font-semibold text-base mb-1">
                          {vol.Role}
                        </h4>
                      )}
                      {vol.Organization && (
                        <p className="text-white/70 text-sm mb-1">
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
          {hasValidItems(parsedData.languages) && (
            <Card className="bg-gradient-to-br from-violet-600/10 to-purple-600/5 backdrop-blur-sm border-violet-500/20 hover:border-violet-400/30 transition-all">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-white text-lg sm:text-xl">
                  <div className="p-2 bg-violet-500/20 rounded-lg mr-3">
                    <Languages className="w-5 h-5 sm:w-6 sm:h-6 text-violet-400" />
                  </div>
                  Languages
                  <span className="ml-2 text-white/60 text-sm font-normal">
                    ({parsedData.languages.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {parsedData.languages.map((lang, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-violet-500/10"
                    >
                      <span className="text-white font-medium">
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
          {hasValidSkills(parsedData.interests) && (
            <Card className="bg-gradient-to-br from-fuchsia-600/10 to-purple-600/5 backdrop-blur-sm border-fuchsia-500/20 hover:border-fuchsia-400/30 transition-all">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-white text-lg sm:text-xl">
                  <div className="p-2 bg-fuchsia-500/20 rounded-lg mr-3">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-fuchsia-400" />
                  </div>
                  Interests & Hobbies
                  <span className="ml-2 text-white/60 text-sm font-normal">
                    ({parsedData.interests.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {parsedData.interests.map((interest, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-fuchsia-500/20 border border-fuchsia-500/30 rounded-full text-white text-sm"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* References */}
          {hasValidItems(parsedData.references) && (
            <Card className="bg-gradient-to-br from-slate-600/10 to-gray-600/5 backdrop-blur-sm border-slate-500/20 hover:border-slate-400/30 transition-all">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-white text-lg sm:text-xl">
                  <div className="p-2 bg-slate-500/20 rounded-lg mr-3">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
                  </div>
                  References
                  <span className="ml-2 text-white/60 text-sm font-normal">
                    ({parsedData.references.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {parsedData.references.map((ref, index) => (
                    <div
                      key={index}
                      className="p-4 bg-white/5 rounded-lg border border-slate-500/10"
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
                        <p className="text-white/70 text-sm">{ref.Contact}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Extra Sections */}
          {parsedData.extra_sections &&
            Object.keys(parsedData.extra_sections).length > 0 && (
              <Card className="bg-gradient-to-br from-amber-600/10 to-yellow-600/5 backdrop-blur-sm border-amber-500/20 hover:border-amber-400/30 transition-all">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-white text-lg sm:text-xl">
                    <div className="p-2 bg-amber-500/20 rounded-lg mr-3">
                      <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
                    </div>
                    Additional Information
                    <span className="ml-2 text-white/60 text-sm font-normal">
                      ({Object.keys(parsedData.extra_sections).length} section
                      {Object.keys(parsedData.extra_sections).length !== 1
                        ? "s"
                        : ""}
                      )
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(parsedData.extra_sections).map(
                    ([sectionName, sectionData], idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-white/5 rounded-lg border border-amber-500/10"
                      >
                        <h4 className="text-white font-semibold text-base mb-3">
                          {sectionName}
                        </h4>
                        <div className="space-y-2">
                          {Array.isArray(sectionData) ? (
                            sectionData.map((item, itemIdx) => (
                              <div
                                key={itemIdx}
                                className="text-sm text-white/70 pl-3 border-l-2 border-amber-500/20"
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

          {/* Academic Marks */}
          {(parsedData.tenth_marks || parsedData.twelfth_marks) && (
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
                  {parsedData.tenth_marks && (
                    <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                      <Award className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-white/60 text-xs sm:text-sm mb-1">
                          10th Grade Marks
                        </p>
                        <p className="text-white font-medium text-sm sm:text-base">
                          {parsedData.tenth_marks}
                        </p>
                      </div>
                    </div>
                  )}
                  {parsedData.twelfth_marks && (
                    <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                      <Award className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-white/60 text-xs sm:text-sm mb-1">
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
        </div>
        {/* Action Button */}
        <div className="mt-8 text-center">
          <Button
            size="lg"
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-base sm:text-lg font-semibold w-full sm:w-auto"
            onClick={() =>
              navigate("/candidate/ai-insights", {
                state: { parsedData, fileName },
              })
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
