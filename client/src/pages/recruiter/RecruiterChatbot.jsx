import { useState, useEffect, useRef, useCallback } from "react";
import {
  Send,
  Bot,
  ArrowLeft,
  Users,
  Lightbulb,
  Target,
  Mail,
  Copy,
  Check,
  X,
  Bookmark,
  BookmarkCheck,
  Download,
  Table,
  LayoutGrid,
  Filter,
  ChevronDown,
  ChevronUp,
  SortAsc,
  SortDesc,
  FileText,
  Sheet,
  Trash2,
  Search,
} from "lucide-react";

const API_BASE_URL = "https://resume-parser-and-manager.onrender.com";

// ─── Export Helpers ────────────────────────────────────────────────────────────
const exportToCSV = (candidates, filename = "candidates") => {
  if (!candidates.length) return;
  const headers = [
    "Rank",
    "Name",
    "Email",
    "Match %",
    "Skills",
    "Experience",
    "Education",
  ];
  const rows = candidates.map((c, i) => [
    i + 1,
    c.name || "",
    c.email || "",
    c.relevance_score || "",
    (c.skills || []).join("; "),
    c.experience_summary || "",
    c.education_summary || "",
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const exportToPDF = (candidates, filename = "candidates") => {
  if (!candidates.length) return;
  const rows = candidates
    .map(
      (c, i) => `
    <tr style="border-bottom:1px solid #e5e7eb;${i % 2 === 0 ? "background:#f9fafb" : ""}">
      <td style="padding:10px 14px;font-weight:600;color:#7c3aed">${i + 1}</td>
      <td style="padding:10px 14px;font-weight:600">${c.name || "—"}</td>
      <td style="padding:10px 14px;color:#6b7280">${c.email || "—"}</td>
      <td style="padding:10px 14px;text-align:center">
        ${c.relevance_score ? `<span style="background:#ede9fe;color:#7c3aed;padding:2px 10px;border-radius:99px;font-size:12px;font-weight:700">${c.relevance_score}%</span>` : "—"}
      </td>
      <td style="padding:10px 14px;font-size:13px;color:#374151">${(c.skills || []).slice(0, 5).join(", ") || "—"}</td>
      <td style="padding:10px 14px;font-size:13px;color:#374151">${c.experience_summary || "—"}</td>
    </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>${filename}</title>
    <style>body{font-family:'Segoe UI',sans-serif;margin:40px;color:#111}</style>
  </head><body>
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:28px">
      <div style="width:36px;height:36px;background:#7c3aed;border-radius:8px;display:flex;align-items:center;justify-content:center">
        <span style="color:white;font-size:18px">✦</span>
      </div>
      <div>
        <h1 style="margin:0;font-size:22px;font-weight:700">${filename}</h1>
        <p style="margin:0;font-size:13px;color:#9ca3af">Generated ${new Date().toLocaleDateString()}</p>
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead>
        <tr style="background:#7c3aed;color:white">
          <th style="padding:12px 14px;text-align:left;font-weight:600">#</th>
          <th style="padding:12px 14px;text-align:left;font-weight:600">Name</th>
          <th style="padding:12px 14px;text-align:left;font-weight:600">Email</th>
          <th style="padding:12px 14px;text-align:center;font-weight:600">Match</th>
          <th style="padding:12px 14px;text-align:left;font-weight:600">Top Skills</th>
          <th style="padding:12px 14px;text-align:left;font-weight:600">Experience</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin-top:24px;font-size:12px;color:#9ca3af;text-align:right">${candidates.length} candidates · AI Candidate Assistant</p>
  </body></html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  setTimeout(() => {
    win.print();
  }, 400);
};

// ─── Filter Panel ──────────────────────────────────────────────────────────────
const FilterPanel = ({ isOpen, onClose, onApply, allSkills }) => {
  const [skillSearch, setSkillSearch] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [sortBy, setSortBy] = useState("relevance");
  const [sortDir, setSortDir] = useState("desc");
  const [minScore, setMinScore] = useState(0);

  const filtered = allSkills.filter((s) =>
    s.toLowerCase().includes(skillSearch.toLowerCase()),
  );

  const toggleSkill = (s) =>
    setSelectedSkills((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );

  const handleApply = () => {
    onApply({ selectedSkills, sortBy, sortDir, minScore });
    onClose();
  };

  const reset = () => {
    setSelectedSkills([]);
    setSortBy("relevance");
    setSortDir("desc");
    setMinScore(0);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-[#1e1528] border border-white/10 rounded-2xl w-full max-w-md p-5 shadow-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Filter className="w-4 h-4 text-purple-400" /> Filter & Sort
          </h3>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sort */}
        <div className="mb-4">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-2">
            Sort By
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              ["relevance", "Match Score"],
              ["name", "Name"],
              ["experience", "Experience"],
            ].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setSortBy(val)}
                className={`text-xs py-2 rounded-lg border transition-all ${sortBy === val ? "bg-purple-600 border-purple-500 text-white" : "bg-white/5 border-white/10 text-white/60 hover:border-purple-500/50"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            {[
              ["desc", "Descending", SortDesc],
              ["asc", "Ascending", SortAsc],
            ].map(([val, label, Icon]) => (
              <button
                key={val}
                onClick={() => setSortDir(val)}
                className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg border transition-all ${sortDir === val ? "bg-purple-600/30 border-purple-500 text-purple-300" : "bg-white/5 border-white/10 text-white/60"}`}
              >
                <Icon className="w-3 h-3" /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Min score */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs text-white/40 uppercase tracking-wider">
              Min Match Score
            </p>
            <span className="text-xs text-purple-400 font-mono font-bold">
              {minScore}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-full accent-purple-500"
          />
        </div>

        {/* Skills filter */}
        {allSkills.length > 0 && (
          <div className="mb-5">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2">
              Filter by Skills
            </p>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30" />
              <input
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
                placeholder="Search skills..."
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
              {filtered.slice(0, 30).map((skill) => (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${selectedSkills.includes(skill) ? "bg-purple-600 border-purple-500 text-white" : "bg-white/5 border-white/10 text-white/60 hover:border-purple-500/40"}`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={reset}
            className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition-all"
          >
            Reset
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-all"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Candidate Card (card or table row) ───────────────────────────────────────
const CandidateCard = ({
  candidate,
  idx,
  onEmailClick,
  onBookmark,
  isBookmarked,
}) => (
  <div className="bg-white/8 rounded-xl p-3 border border-white/15 hover:border-purple-500/40 transition-all group">
    <div className="flex justify-between items-start mb-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-purple-300 text-sm">
            {idx + 1}. {candidate.name}
          </span>
          {/* {candidate.relevance_score && (
            <span className="text-xs bg-purple-600/30 px-2 py-0.5 rounded-full text-purple-300 font-mono">
              {candidate.relevance_score}
            </span>
          )} */}
        </div>
      </div>
      <button
        onClick={() => onBookmark(candidate)}
        className={`ml-2 p-1 rounded-lg transition-all shrink-0 ${isBookmarked ? "text-yellow-400 bg-yellow-400/10" : "text-white/20 hover:text-yellow-400 hover:bg-yellow-400/10"}`}
        title={isBookmarked ? "Remove bookmark" : "Bookmark candidate"}
      >
        {isBookmarked ? (
          <BookmarkCheck className="w-4 h-4" />
        ) : (
          <Bookmark className="w-4 h-4" />
        )}
      </button>
    </div>

    {candidate.email_available ? (
      <button
        onClick={() =>
          onEmailClick(candidate.id, candidate.name, candidate.email)
        }
        className="flex items-center gap-1.5 text-xs bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 px-2 py-1 rounded-md transition-colors mb-2 max-w-full"
      >
        <Mail className="w-3 h-3 shrink-0" />
        <span className="truncate">{candidate.email}</span>
      </button>
    ) : (
      <div className="flex items-center gap-1.5 text-xs bg-gray-600/20 text-gray-500 px-2 py-1 rounded-md mb-2">
        <Mail className="w-3 h-3" />
        <span>No email</span>
      </div>
    )}

    {candidate.skills?.length > 0 && (
      <div className="flex flex-wrap gap-1 mb-2">
        {candidate.skills.slice(0, 6).map((skill, i) => (
          <span
            key={i}
            className="text-xs bg-white/8 border border-white/10 px-2 py-0.5 rounded-full text-white/70"
          >
            {skill}
          </span>
        ))}
        {candidate.skills.length > 6 && (
          <span className="text-xs text-white/30">
            +{candidate.skills.length - 6}
          </span>
        )}
      </div>
    )}

    {candidate.experience_summary && (
      <p className="text-xs text-white/60 mb-0.5">
        <span className="text-white/40 font-medium">Exp:</span>{" "}
        {candidate.experience_summary}
      </p>
    )}
    {candidate.education_summary && (
      <p className="text-xs text-white/60">
        <span className="text-white/40 font-medium">Edu:</span>{" "}
        {candidate.education_summary}
      </p>
    )}
  </div>
);

// ─── Table Row ─────────────────────────────────────────────────────────────────
const TableRow = ({
  candidate,
  idx,
  onEmailClick,
  onBookmark,
  isBookmarked,
}) => (
  <tr className="border-b border-white/5 hover:bg-white/5 transition-colors group">
    <td className="px-3 py-2.5 text-xs text-white/40 font-mono">{idx + 1}</td>
    <td className="px-3 py-2.5">
      <span className="text-sm font-semibold text-white">{candidate.name}</span>
    </td>
    <td className="px-3 py-2.5">
      {candidate.email_available ? (
        <button
          onClick={() =>
            onEmailClick(candidate.id, candidate.name, candidate.email)
          }
          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          <Mail className="w-3 h-3" />
          <span className="truncate max-w-[140px]">{candidate.email}</span>
        </button>
      ) : (
        <span className="text-xs text-white/30">—</span>
      )}
    </td>
    <td className="px-3 py-2.5 text-center">
      {candidate.relevance_score ? (
        <span className="text-xs bg-purple-600/30 text-purple-300 px-2 py-0.5 rounded-full font-mono">
          {candidate.relevance_score}
        </span>
      ) : (
        <span className="text-xs text-white/30">—</span>
      )}
    </td>
    <td className="px-3 py-2.5">
      <div className="flex flex-wrap gap-1">
        {(candidate.skills || []).slice(0, 4).map((s, i) => (
          <span
            key={i}
            className="text-xs bg-white/8 border border-white/10 px-1.5 py-0.5 rounded text-white/60"
          >
            {s}
          </span>
        ))}
        {(candidate.skills || []).length > 4 && (
          <span className="text-xs text-white/30">
            +{candidate.skills.length - 4}
          </span>
        )}
      </div>
    </td>
    <td className="px-3 py-2.5 text-xs text-white/60 max-w-[160px] truncate">
      {candidate.experience_summary || "—"}
    </td>
    <td className="px-3 py-2.5">
      <button
        onClick={() => onBookmark(candidate)}
        className={`p-1 rounded transition-all ${isBookmarked ? "text-yellow-400" : "text-white/20 hover:text-yellow-400"}`}
      >
        {isBookmarked ? (
          <BookmarkCheck className="w-3.5 h-3.5" />
        ) : (
          <Bookmark className="w-3.5 h-3.5" />
        )}
      </button>
    </td>
  </tr>
);

// ─── Message Content ───────────────────────────────────────────────────────────
const MessageContent = ({
  msg,
  onEmailClick,
  onBookmark,
  bookmarks,
  filters,
}) => {
  const [viewMode, setViewMode] = useState("card"); // "card" | "table"

  if (msg.role !== "assistant" || !msg.candidates?.length) {
    return (
      <p className="text-sm leading-relaxed whitespace-pre-wrap">
        {msg.content}
      </p>
    );
  }

  // Apply filters
  let candidates = [...msg.candidates];
  if (filters) {
    if (filters.selectedSkills?.length) {
      candidates = candidates.filter((c) =>
        filters.selectedSkills.every((s) =>
          (c.skills || [])
            .map((sk) => sk.toLowerCase())
            .includes(s.toLowerCase()),
        ),
      );
    }
    if (filters.minScore > 0) {
      candidates = candidates.filter(
        (c) => (c.relevance_score || 0) >= filters.minScore,
      );
    }
    if (filters.sortBy === "name") {
      candidates.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (filters.sortBy === "relevance") {
      candidates.sort(
        (a, b) => (b.relevance_score || 0) - (a.relevance_score || 0),
      );
    }
    if (filters.sortDir === "asc" && filters.sortBy !== "name")
      candidates.reverse();
  }

  const intro = msg.content.split("\n\n")[0];

  return (
    <div>
      <p className="text-sm leading-relaxed whitespace-pre-wrap mb-3 text-white/80">
        {intro}
      </p>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5 gap-0.5">
          <button
            onClick={() => setViewMode("card")}
            className={`p-1.5 rounded-md transition-all ${viewMode === "card" ? "bg-purple-600 text-white" : "text-white/40 hover:text-white"}`}
            title="Card view"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`p-1.5 rounded-md transition-all ${viewMode === "table" ? "bg-purple-600 text-white" : "text-white/40 hover:text-white"}`}
            title="Table view"
          >
            <Table className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          <button
            onClick={() => exportToCSV(candidates, "query-candidates")}
            className="flex items-center gap-1 text-xs bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 px-2.5 py-1.5 rounded-lg transition-all border border-emerald-500/20"
            title="Export CSV"
          >
            <Sheet className="w-3 h-3" /> CSV
          </button>
          <button
            onClick={() => exportToPDF(candidates, "query-candidates")}
            className="flex items-center gap-1 text-xs bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 px-2.5 py-1.5 rounded-lg transition-all border border-rose-500/20"
            title="Export PDF"
          >
            <FileText className="w-3 h-3" /> PDF
          </button>
        </div>
      </div>

      {/* Card View */}
      {viewMode === "card" && (
        <div className="space-y-2">
          {candidates.length === 0 ? (
            <p className="text-xs text-white/30 italic text-center py-4">
              No candidates match the current filters.
            </p>
          ) : (
            candidates.map((c, i) => (
              <CandidateCard
                key={c.id}
                idx={i}
                candidate={c}
                onEmailClick={onEmailClick}
                onBookmark={onBookmark}
                isBookmarked={bookmarks.some((b) => b.id === c.id)}
              />
            ))
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                {[
                  "#",
                  "Name",
                  "Email",
                  "Match",
                  "Skills",
                  "Experience",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 text-xs text-white/40 font-semibold uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {candidates.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center text-xs text-white/30 py-6"
                  >
                    No candidates match the current filters.
                  </td>
                </tr>
              ) : (
                candidates.map((c, i) => (
                  <TableRow
                    key={c.id}
                    idx={i}
                    candidate={c}
                    onEmailClick={onEmailClick}
                    onBookmark={onBookmark}
                    isBookmarked={bookmarks.some((b) => b.id === c.id)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-white/30 mt-3 italic">
        {candidates.length} candidate{candidates.length !== 1 ? "s" : ""} ·
        Click email to generate outreach · ★ to bookmark
      </p>
    </div>
  );
};

// ─── Bookmarks Sidebar ─────────────────────────────────────────────────────────
const BookmarksSidebar = ({
  bookmarks,
  onRemove,
  onEmailClick,
  onExportCSV,
  onExportPDF,
}) => {
  const [search, setSearch] = useState("");
  const filtered = bookmarks.filter(
    (b) =>
      b.name?.toLowerCase().includes(search.toLowerCase()) ||
      (b.skills || []).some((s) =>
        s.toLowerCase().includes(search.toLowerCase()),
      ),
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-white/5">
        <div className="flex items-center gap-2 mb-2">
          <BookmarkCheck className="w-4 h-4 text-yellow-400" />
          <h3 className="text-white text-sm font-semibold">Saved Candidates</h3>
          <span className="ml-auto text-xs bg-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded-full font-mono">
            {bookmarks.length}
          </span>
        </div>
        {bookmarks.length > 0 && (
          <div className="flex gap-1.5">
            <button
              onClick={onExportCSV}
              className="flex-1 flex items-center justify-center gap-1 text-xs bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 py-1.5 rounded-lg transition-all"
            >
              <Sheet className="w-3 h-3" /> CSV
            </button>
            <button
              onClick={onExportPDF}
              className="flex-1 flex items-center justify-center gap-1 text-xs bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 py-1.5 rounded-lg transition-all"
            >
              <FileText className="w-3 h-3" /> PDF
            </button>
          </div>
        )}
      </div>

      {bookmarks.length > 0 && (
        <div className="px-3 pt-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search saved..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-7 pr-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-yellow-400/40"
            />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filtered.length === 0 && bookmarks.length === 0 && (
          <div className="text-center py-8">
            <Bookmark className="w-8 h-8 text-white/10 mx-auto mb-2" />
            <p className="text-xs text-white/30">No saved candidates yet.</p>
            <p className="text-xs text-white/20 mt-1">
              Click ★ on any candidate
            </p>
          </div>
        )}
        {filtered.length === 0 && bookmarks.length > 0 && (
          <p className="text-xs text-white/30 text-center py-4">
            No matches found.
          </p>
        )}
        {filtered.map((c, i) => (
          <div
            key={c.id}
            className="bg-white/5 border border-white/10 rounded-xl p-3 hover:border-yellow-400/30 transition-all group"
          >
            <div className="flex justify-between items-start mb-1.5">
              <span className="text-sm font-semibold text-white">{c.name}</span>
              <button
                onClick={() => onRemove(c.id)}
                className="text-white/20 hover:text-red-400 transition-colors p-0.5 opacity-0 group-hover:opacity-100"
                title="Remove"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {c.relevance_score && (
              <span className="text-xs bg-purple-600/25 text-purple-300 px-2 py-0.5 rounded-full font-mono mb-1.5 inline-block">
                {c.relevance_score}% match
              </span>
            )}

            {c.email_available && (
              <button
                onClick={() => onEmailClick(c.id, c.name, c.email)}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors mb-1.5"
              >
                <Mail className="w-3 h-3" />
                <span className="truncate max-w-[160px]">{c.email}</span>
              </button>
            )}

            {c.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {c.skills.slice(0, 4).map((s, si) => (
                  <span
                    key={si}
                    className="text-xs bg-white/5 px-1.5 py-0.5 rounded text-white/50"
                  >
                    {s}
                  </span>
                ))}
                {c.skills.length > 4 && (
                  <span className="text-xs text-white/30">
                    +{c.skills.length - 4}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const RecruiterChatbot = () => {
  const [stats, setStats] = useState({ total_candidates: 0, unique_skills: 0 });
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I'm your AI-powered candidate search assistant. I analyze all profiles and rank them by relevance. When I show you candidates, click on their email to generate an automated message!",
      isComplete: true,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastQueryInfo, setLastQueryInfo] = useState(null);
  const [typingMessage, setTypingMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Sidebar state
  const [rightPanel, setRightPanel] = useState("suggestions"); // "suggestions" | "bookmarks"

  // Bookmarks
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("chatbot_bookmarks") || "[]");
    } catch {
      return [];
    }
  });

  // Filters
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState(null);
  const [allSkills, setAllSkills] = useState([]);

  // Email modal
  const [emailModal, setEmailModal] = useState({
    isOpen: false,
    candidateName: "",
    candidateEmail: "",
    subject: "",
    body: "",
    mailtoLink: "",
    loading: false,
    copied: false,
  });

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    if (isTyping) scrollToBottom();
  }, [typingMessage, isTyping]);
  useEffect(() => {
    if (messages.length > 0) setTimeout(scrollToBottom, 100);
  }, [messages]);
  useEffect(() => {
    fetchStats();
  }, []);

  // Persist bookmarks
  useEffect(() => {
    try {
      localStorage.setItem("chatbot_bookmarks", JSON.stringify(bookmarks));
    } catch {}
  }, [bookmarks]);

  // Collect all skills from messages
  useEffect(() => {
    const skills = new Set();
    messages.forEach((m) =>
      m.candidates?.forEach((c) =>
        (c.skills || []).forEach((s) => skills.add(s)),
      ),
    );
    setAllSkills([...skills].sort());
  }, [messages]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/recruiter/chatbot/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const typeMessage = async (text) => {
    setIsTyping(true);
    setTypingMessage("");
    const words = text.split(" ");
    let cur = "";
    for (let i = 0; i < words.length; i++) {
      cur += (i > 0 ? " " : "") + words[i];
      setTypingMessage(cur);
      await new Promise((r) => setTimeout(r, words[i].length > 8 ? 40 : 25));
    }
    setIsTyping(false);
    setTypingMessage("");
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: text, isComplete: true },
    ]);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || isTyping) return;
    const currentInput = input;
    setInput("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: currentInput, isComplete: true },
    ]);
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/recruiter/chatbot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: currentInput,
          conversation_history: messages.filter((m) => m.isComplete),
        }),
      });
      const data = await res.json();
      setIsLoading(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
          candidates: data.candidates || [],
          isComplete: true,
        },
      ]);
      if (data.ranking_applied) {
        setLastQueryInfo({
          analyzed: data.candidates_analyzed,
          shown: data.candidates_shown,
          intent: data.intent_detected || {},
        });
      }
    } catch {
      setIsLoading(false);
      await typeMessage("Error processing request.");
    }
  };

  const handleBookmark = useCallback((candidate) => {
    setBookmarks((prev) => {
      const exists = prev.some((b) => b.id === candidate.id);
      return exists
        ? prev.filter((b) => b.id !== candidate.id)
        : [...prev, candidate];
    });
  }, []);

  const handleRemoveBookmark = useCallback((id) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const handleEmailClick = async (
    candidateId,
    candidateName,
    candidateEmail,
  ) => {
    if (!candidateEmail) return alert("No email available for this candidate");
    setEmailModal({
      isOpen: true,
      candidateName,
      candidateEmail,
      loading: true,
      error: null,
    });
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE_URL}/api/recruiter/chatbot/generate-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            candidate_id: String(candidateId),
            job_context: lastQueryInfo?.intent?.query || "Relevant position",
          }),
        },
      );
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.detail || "Failed");
      }
      const data = await res.json();
      setEmailModal({
        isOpen: true,
        candidateName: data.candidate_name,
        candidateEmail: data.candidate_email,
        subject: data.subject,
        body: data.body,
        mailtoLink: data.mailto_link,
        loading: false,
        copied: false,
        error: null,
      });
    } catch (err) {
      setEmailModal((prev) => ({
        ...prev,
        loading: false,
        error: err.message,
      }));
    }
  };

  const closeEmailModal = () =>
    setEmailModal({
      isOpen: false,
      candidateName: "",
      candidateEmail: "",
      subject: "",
      body: "",
      mailtoLink: "",
      loading: false,
      copied: false,
    });

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setEmailModal((prev) => ({ ...prev, copied: true }));
    setTimeout(
      () => setEmailModal((prev) => ({ ...prev, copied: false })),
      2000,
    );
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#221824] flex items-center justify-center text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );

  return (
    <div className="h-screen flex flex-col bg-[#221824] overflow-hidden">
      {/* ── Email Modal ── */}
      {emailModal.isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2a1f2a] border border-white/20 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Mail className="w-4 h-4 text-purple-400" /> Email to{" "}
                {emailModal.candidateName}
              </h3>
              <button
                onClick={closeEmailModal}
                className="text-white/50 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {emailModal.loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  <p className="ml-3 text-white/70">Generating email...</p>
                </div>
              ) : emailModal.error ? (
                <div className="text-red-400 p-4 text-center">
                  {emailModal.error}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-white/40 uppercase block mb-1">
                      To:
                    </label>
                    <div className="bg-white/5 p-3 rounded-lg text-white">
                      {emailModal.candidateEmail}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-white/40 uppercase block mb-1">
                      Subject:
                    </label>
                    <div className="bg-white/5 p-3 rounded-lg text-white font-medium">
                      {emailModal.subject}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-white/40 uppercase block mb-1">
                      Body:
                    </label>
                    <div className="bg-white/5 p-4 rounded-lg text-white whitespace-pre-wrap font-mono text-sm">
                      {emailModal.body}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-white/10 flex gap-2">
              <button
                onClick={() =>
                  copyToClipboard(`${emailModal.subject}\n\n${emailModal.body}`)
                }
                disabled={emailModal.loading || emailModal.error}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-white text-sm"
              >
                {emailModal.copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  window.location.href = `mailto:${emailModal.candidateEmail}?subject=${encodeURIComponent(emailModal.subject)}&body=${encodeURIComponent(emailModal.body)}`;
                }}
                disabled={
                  emailModal.loading ||
                  emailModal.error ||
                  !emailModal.candidateEmail
                }
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-white text-sm ml-auto"
              >
                <Mail className="w-4 h-4" /> Open in Email Client
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Filter Modal ── */}
      <FilterPanel
        isOpen={filterPanelOpen}
        onClose={() => setFilterPanelOpen(false)}
        onApply={setActiveFilters}
        allSkills={allSkills}
      />

      {/* ── Navbar ── */}
      <nav className="h-14 border-b border-white/10 flex items-center px-4 shrink-0 gap-3">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5 text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="ml-auto flex items-center gap-2">
          {/* Active filter indicator */}
          {activeFilters && (
            <button
              onClick={() => setActiveFilters(null)}
              className="flex items-center gap-1 text-xs bg-purple-600/20 text-purple-300 border border-purple-500/30 px-2.5 py-1.5 rounded-lg hover:bg-purple-600/30 transition-all"
            >
              <X className="w-3 h-3" /> Clear filters
            </button>
          )}
          <button
            onClick={() => setFilterPanelOpen(true)}
            className={`flex items-center gap-1.5 cursor-pointer text-xs px-3 py-1.5 rounded-lg border transition-all ${activeFilters ? "bg-purple-600/20 border-purple-500/40 text-purple-300" : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/20"}`}
          >
            <Filter className="w-3.5 h-3.5" /> Filters
          </button>
        </div>
      </nav>

      {/* ── Main Layout ── */}
      <div className="flex-1 flex overflow-hidden container mx-auto max-w-7xl py-4 gap-4 px-4">
        {/* Chat */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 flex flex-col bg-gray-900/40 border border-white/8 rounded-2xl overflow-hidden">
            {/* Chat header */}
            <div className="border-b border-white/5 bg-gray-900/60 px-4 py-3 shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/30 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-white text-sm font-semibold">
                    AI Candidate Assistant
                  </h2>
                  <p className="text-xs text-white/40">
                    {isTyping ? "Typing…" : "Smart Ranking Active"}
                  </p>
                </div>
              </div>
              {lastQueryInfo && (
                <div className="flex items-center gap-1 text-xs text-white/30">
                  <Target className="w-3 h-3" /> {lastQueryInfo.analyzed}{" "}
                  scanned
                </div>
              )}
            </div>

            {/* Messages */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
              style={{ scrollBehavior: "smooth" }}
            >
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  style={{ animation: "fadeInUp 0.35s ease-out" }}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl ${
                      msg.role === "user"
                        ? "bg-purple-600 text-white rounded-tr-none"
                        : "bg-white/5 text-white border border-white/8 rounded-tl-none"
                    }`}
                  >
                    <MessageContent
                      msg={msg}
                      onEmailClick={handleEmailClick}
                      onBookmark={handleBookmark}
                      bookmarks={bookmarks}
                      filters={activeFilters}
                    />
                  </div>
                </div>
              ))}

              {isTyping && typingMessage && (
                <div
                  className="flex justify-start"
                  style={{ animation: "fadeInUp 0.35s ease-out" }}
                >
                  <div className="max-w-[85%] p-3.5 rounded-2xl bg-white/5 text-white border border-white/8 rounded-tl-none">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {typingMessage}
                      <span className="inline-block w-1 h-4 bg-purple-400 ml-1 animate-pulse rounded" />
                    </p>
                  </div>
                </div>
              )}

              {isLoading && !isTyping && (
                <div
                  className="flex justify-start"
                  style={{ animation: "fadeInUp 0.35s ease-out" }}
                >
                  <div className="flex gap-1.5 p-3.5 bg-white/5 rounded-xl border border-white/8">
                    {[0, 0.2, 0.4].map((d, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${d}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/5 bg-gray-900/60 shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g., Find me top 3 React developers..."
                  className="flex-1 bg-white/5 border border-white/10 text-white h-11 rounded-xl px-4 text-sm focus:outline-none focus:border-purple-500/50 transition-all placeholder:text-white/30"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  disabled={isLoading || isTyping}
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || isTyping || !input.trim()}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed h-11 px-5 rounded-xl transition-all flex items-center justify-center shrink-0"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Sidebar ── */}
        <div className="w-72 hidden lg:flex flex-col gap-3 shrink-0">
          {/* Stats */}
          <div className="bg-white/5 border border-white/8 rounded-2xl p-3">
            <div className="flex items-center gap-2 mb-2.5">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <h3 className="text-white text-xs font-semibold uppercase tracking-wider">
                Database
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 text-center">
                <p className="text-[10px] text-white/30 uppercase mb-0.5">
                  Candidates
                </p>
                <p className="text-xl font-bold text-white font-mono">
                  {stats.total_candidates}
                </p>
              </div>
              <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 text-center">
                <p className="text-[10px] text-white/30 uppercase mb-0.5">
                  Skills
                </p>
                <p className="text-xl font-bold text-white font-mono">
                  {stats.unique_skills}
                </p>
              </div>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex bg-white/5 border border-white/8 rounded-xl p-1 gap-1">
            <button
              onClick={() => setRightPanel("suggestions")}
              className={`flex-1 text-xs py-1.5 rounded-lg transition-all font-medium ${rightPanel === "suggestions" ? "bg-purple-600 text-white" : "text-white/50 hover:text-white"}`}
            >
              <Lightbulb className="w-3 h-3 inline mr-1" />
              Prompts
            </button>
            <button
              onClick={() => setRightPanel("bookmarks")}
              className={`flex-1 text-xs py-1.5 rounded-lg transition-all font-medium relative ${rightPanel === "bookmarks" ? "bg-yellow-500/80 text-white" : "text-white/50 hover:text-white"}`}
            >
              <Bookmark className="w-3 h-3 inline mr-1" />
              Saved
              {bookmarks.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 text-black text-[9px] font-bold rounded-full flex items-center justify-center">
                  {bookmarks.length > 9 ? "9+" : bookmarks.length}
                </span>
              )}
            </button>
          </div>

          {/* Panel content */}
          <div className="flex-1 bg-white/5 border border-white/8 rounded-2xl overflow-hidden flex flex-col min-h-0">
            {rightPanel === "suggestions" ? (
              <>
                <div className="p-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
                    <h3 className="text-white text-xs font-semibold">
                      Suggestions
                    </h3>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                  {[
                    "Top 5 Python Developers",
                    "Top React Developers",
                    "Male Java Developers from Odisha",
                    "Top 5 Web Developers based on projects, skills, and experience",
                    "Best in Data Science/Analytics",
                    "Candidates with minimum teaching experience of 2 years",
                  ].map((text, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(text)}
                      disabled={isLoading || isTyping}
                      className="w-full text-left p-2.5 rounded-lg bg-white/5 border border-white/5 hover:border-purple-500/40 hover:bg-purple-500/8 text-xs text-white/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed leading-relaxed"
                    >
                      {text}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <BookmarksSidebar
                bookmarks={bookmarks}
                onRemove={handleRemoveBookmark}
                onEmailClick={handleEmailClick}
                onExportCSV={() => exportToCSV(bookmarks, "saved-candidates")}
                onExportPDF={() => exportToPDF(bookmarks, "saved-candidates")}
              />
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default RecruiterChatbot;
