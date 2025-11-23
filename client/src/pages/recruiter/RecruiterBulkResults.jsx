import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  User,
  GraduationCap,
  Briefcase,
  Code,
  Award,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

/* RecruiterBulkResults
   - Matches Candidate ParsedResults UI (clean, card-based, dark theme)
   - No AI insights button
   - No JSON export / counts
   - Clean formatting for objects & arrays
*/

const fmtItem = (v) => {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "object") {
    const degree = v.Degree || v.degree || v.Role || v.title || v.Name;
    const org = v.University || v.Company || v.Organization;
    const years = v.Years || v.years || v.Date;
    const descr = v.Description || v.description;
    const parts = [];
    if (degree) parts.push(degree);
    if (org) parts.push(org);
    if (years) parts.push(`(${years})`);
    if (descr) parts.push(`- ${descr}`);
    return parts.join(" ");
  }
  return String(v);
};

export default function RecruiterBulkResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const [results, setResults] = useState(null);
  const [expandedIdx, setExpandedIdx] = useState(null);

  useEffect(() => {
    // Prefer router state, but fallback to localStorage (so refresh keeps data)
    const stateFromRouter = location?.state || null;
    if (stateFromRouter && (stateFromRouter.successful || stateFromRouter.failed)) {
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
    // nothing -> redirect back to upload
    setTimeout(() => navigate("/recruiter/bulk-upload"), 250);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "rgb(34, 24, 36)" }}>
        <div className="text-white/80">Loading parsed results... (or none found)</div>
      </div>
    );
  }

  const successful = results.successful || [];
  const failed = results.failed || [];

  return (
    <div className="min-h-screen pt-16" style={{ backgroundColor: "rgb(34,24,36)" }}>
      <div className="container mx-auto max-w-7xl py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" className="border-white/20 text-white" onClick={() => navigate("/recruiter/bulk-upload")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <h1 className="text-2xl font-bold text-white">Parsed Resumes</h1>
        </div>

        {/* Cards grid */}
        <div className="flex flex-col gap-6">
          {successful.map((item, idx) => {
            const data = item.data || item.parsed_data || {};
            const name = data.name || data.Name || "Unknown";
            const email = data.email || data.Email || "";
            return (
              <Card key={idx} className="bg-white/5 border-white/10">
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded mr-2">
                        <User className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <div className="text-white font-semibold">{name}</div>
                        <div className="text-white/70 text-sm">{email}</div>
                      </div>
                    </div>

                    <button
                      className="ml-3 p-2 rounded bg-white/5 hover:bg-white/10"
                      onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                      aria-label="Toggle details"
                    >
                      {expandedIdx === idx ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                    </button>
                  </div>
                </CardHeader>

                {expandedIdx === idx && (
                  <CardContent className="p-4 border-t border-white/5">
                    {/* Personal Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      {data.name && (
                        <div className="p-3 bg-white/5 rounded">
                          <div className="text-white/60 text-xs">Full Name</div>
                          <div className="text-white font-medium">{data.name}</div>
                        </div>
                      )}
                      {data.email && (
                        <div className="p-3 bg-white/5 rounded">
                          <div className="text-white/60 text-xs">Email</div>
                          <div className="text-white font-medium break-words">{data.email}</div>
                        </div>
                      )}
                      {data.phone && (
                        <div className="p-3 bg-white/5 rounded">
                          <div className="text-white/60 text-xs">Phone</div>
                          <div className="text-white font-medium">{data.phone}</div>
                        </div>
                      )}
                    </div>

                    {/* Education */}
                    {data.education && data.education.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-white font-semibold mb-2"><GraduationCap className="inline mr-2"/> Education</h4>
                        <div className="space-y-3">
                          {data.education.map((edu, i) => (
                            <div key={i} className="p-3 bg-white/5 rounded">
                              <div className="text-white font-semibold">{fmtItem(edu)}</div>
                              <div className="text-white/60 text-sm mt-1">{(edu.Grade ? `Grade: ${edu.Grade}` : "") + (edu.Years ? ` ${edu.Years}` : "")}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Experience */}
                    {data.experience && data.experience.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-white font-semibold mb-2"><Briefcase className="inline mr-2"/> Experience</h4>
                        <div className="space-y-3">
                          {data.experience.map((exp, i) => (
                            <div key={i} className="p-3 bg-white/5 rounded">
                              <div className="text-white font-semibold">{fmtItem(exp)}</div>
                              <div className="text-white/60 text-sm mt-1">{exp.Description || exp.Responsibilities || ""}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skills */}
                    {data.skills && data.skills.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-white font-semibold mb-2"><Code className="inline mr-2"/> Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {data.skills.map((s, k) => (
                            <span key={k} className="px-3 py-1 rounded-full bg-orange-600/20 text-white text-xs">{typeof s === "string" ? s : fmtItem(s)}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Projects */}
                    {data.projects && data.projects.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-white font-semibold mb-2"><Award className="inline mr-2"/> Projects</h4>
                        <div className="space-y-3">
                          {data.projects.map((p, i) => (
                            <div key={i} className="p-3 bg-white/5 rounded">
                              <div className="text-white font-semibold">{fmtItem(p)}</div>
                              <div className="text-white/60 text-sm mt-1">{p.Description || ""}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* Failed parses (simple list) */}
        {failed.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-red-400 mb-3">Failed to parse</h3>
            <div className="space-y-2">
              {failed.map((f, i) => (
                <div key={i} className="p-3 bg-red-900/10 rounded text-red-200">
                  <div className="font-medium">{f.filename}</div>
                  <div className="text-sm text-red-300">{f.error}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
