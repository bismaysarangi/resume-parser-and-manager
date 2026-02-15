import { useState, useEffect, useRef } from "react";
import {
  Send,
  Bot,
  ArrowLeft,
  Users,
  Lightbulb,
  Award,
  Target,
  Mail,
  Copy,
  Check,
  X,
} from "lucide-react";

const API_BASE_URL = "http://localhost:8000";

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

  // Email modal state
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

  const scrollToBottom = () => {
    if (messagesEndRef.current && chatContainerRef.current) {
      const container = chatContainerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    if (isTyping) {
      scrollToBottom();
    }
  }, [typingMessage, isTyping]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/api/recruiter/chatbot/stats`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const typeMessage = async (text) => {
    setIsTyping(true);
    setTypingMessage("");

    const words = text.split(" ");
    let currentText = "";

    for (let i = 0; i < words.length; i++) {
      currentText += (i > 0 ? " " : "") + words[i];
      setTypingMessage(currentText);

      const delay = words[i].length > 8 ? 40 : 25;
      await new Promise((resolve) => setTimeout(resolve, delay));
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

    const userMessage = { role: "user", content: input, isComplete: true };
    const currentInput = input;
    setInput("");
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/recruiter/chatbot`, {
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

      const data = await response.json();
      setIsLoading(false);

      // Store candidates in the assistant message
      const assistantMessage = {
        role: "assistant",
        content: data.response,
        candidates: data.candidates || [],
        isComplete: true,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (data.ranking_applied) {
        setLastQueryInfo({
          analyzed: data.candidates_analyzed,
          shown: data.candidates_shown,
          intent: data.intent_detected || {},
        });
      }
    } catch (error) {
      setIsLoading(false);
      await typeMessage("Error processing request.");
    }
  };

  const handleEmailClick = async (
    candidateId,
    candidateName,
    candidateEmail,
    jobContext = null,
  ) => {
    if (!candidateEmail) {
      alert("No email available for this candidate");
      return;
    }

    // DEBUG: Log what we're sending
    console.log("📧 Email generation request:", {
      candidateId,
      candidateName,
      candidateEmail,
      jobContext: jobContext || lastQueryInfo?.intent?.query,
    });

    setEmailModal({
      ...emailModal,
      isOpen: true,
      candidateName,
      candidateEmail,
      loading: true,
      error: null, // Clear any previous errors
    });

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }

      const requestBody = {
        candidate_id: String(candidateId), // Ensure it's a string
        job_context:
          jobContext || lastQueryInfo?.intent?.query || "Relevant position",
      };

      console.log("📤 Sending request body:", requestBody);

      const response = await fetch(
        `${API_BASE_URL}/api/recruiter/chatbot/generate-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        },
      );

      // Enhanced error handling
      if (!response.ok) {
        let errorMessage = "Failed to generate email";
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
          console.error("❌ Server error:", errorData);
        } catch (e) {
          // Response might not be JSON
          const errorText = await response.text();
          console.error("❌ Server response:", errorText);
          errorMessage = `Server error: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("✅ Email generated successfully");

      setEmailModal({
        ...emailModal,
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
    } catch (error) {
      console.error("❌ Error generating email:", error);
      setEmailModal({
        ...emailModal,
        isOpen: true,
        candidateName,
        candidateEmail,
        loading: false,
        error: error.message || "Failed to generate email. Please try again.",
        // Keep the modal open so user can see the error
      });
    }
  };

  const closeEmailModal = () => {
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
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setEmailModal({ ...emailModal, copied: true });
    setTimeout(() => {
      setEmailModal({ ...emailModal, copied: false });
    }, 2000);
  };

  // Helper to render message with clickable emails
  const renderMessageContent = (msg) => {
    if (
      msg.role === "assistant" &&
      msg.candidates &&
      msg.candidates.length > 0
    ) {
      // This message contains candidate data, render specially
      return (
        <div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap mb-3">
            {msg.content.split("\n\n")[0]} {/* First part is the intro */}
          </p>

          <div className="space-y-3 mt-3">
            {msg.candidates.map((candidate, idx) => (
              <div
                key={candidate.id}
                className="bg-white/10 rounded-lg p-3 border border-white/20"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-semibold text-purple-300">
                      {idx + 1}. {candidate.name}
                    </span>
                    {candidate.relevance_score && (
                      <span className="ml-2 text-xs bg-purple-600/30 px-2 py-0.5 rounded-full">
                        {candidate.relevance_score}% match
                      </span>
                    )}
                  </div>
                </div>

                {/* Email with click handler */}
                {candidate.email_available ? (
                  <button
                    onClick={() =>
                      handleEmailClick(
                        candidate.id,
                        candidate.name,
                        candidate.email,
                      )
                    }
                    className="flex items-center gap-1.5 text-xs bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 px-2 py-1 rounded-md transition-colors mb-2"
                  >
                    <Mail className="w-3 h-3" />
                    <span className="truncate max-w-[200px]">
                      {candidate.email}
                    </span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs bg-gray-600/30 text-gray-400 px-2 py-1 rounded-md mb-2">
                    <Mail className="w-3 h-3" />
                    <span>No email available</span>
                  </div>
                )}

                {/* Skills */}
                {candidate.skills && candidate.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {candidate.skills.map((skill, i) => (
                      <span
                        key={i}
                        className="text-xs bg-white/10 px-2 py-0.5 rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {/* Experience */}
                {candidate.experience_summary && (
                  <p className="text-xs text-white/70 mb-1">
                    <span className="font-medium">Exp:</span>{" "}
                    {candidate.experience_summary}
                  </p>
                )}

                {/* Education */}
                {candidate.education_summary && (
                  <p className="text-xs text-white/70">
                    <span className="font-medium">Edu:</span>{" "}
                    {candidate.education_summary}
                  </p>
                )}
              </div>
            ))}
          </div>

          <p className="text-sm text-white/50 mt-3 italic">
            Click on an email to generate an automated message!
          </p>
        </div>
      );
    }

    // Regular message without candidates
    return (
      <p className="text-sm leading-relaxed whitespace-pre-wrap">
        {msg.content}
      </p>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#221824] flex items-center justify-center text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#221824] overflow-hidden">
      {/* Email Modal */}
      {emailModal.isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2a1f2a] border border-white/20 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Mail className="w-4 h-4 text-purple-400" />
                Email to {emailModal.candidateName}
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
                  <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
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
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-white text-sm transition-colors"
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

              {/* Direct email button - creates mailto on the fly */}
              <button
                onClick={() => {
                  const subject = encodeURIComponent(emailModal.subject);
                  const body = encodeURIComponent(emailModal.body);
                  window.location.href = `mailto:${emailModal.candidateEmail}?subject=${subject}&body=${body}`;
                }}
                disabled={
                  emailModal.loading ||
                  emailModal.error ||
                  !emailModal.candidateEmail
                }
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-white text-sm transition-colors ml-auto"
              >
                <Mail className="w-4 h-4" />
                Open in Email Client
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="h-16 border-b border-white/10 flex items-center px-6 shrink-0">
        <button
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/5"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </nav>

      <div className="flex-1 flex overflow-hidden container mx-auto max-w-7xl py-6 gap-6 px-6">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 flex flex-col bg-gray-900/50 border border-white/10 rounded-2xl overflow-hidden">
            <div className="border-b border-white/5 bg-gray-900/80 p-4 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bot className="w-6 h-6 text-purple-400" />
                  <div>
                    <h2 className="text-white text-lg font-semibold">
                      AI Candidate Assistant
                    </h2>
                    <p className="text-xs text-white/50">
                      {isTyping ? "Typing..." : "Smart Ranking Active"}
                    </p>
                  </div>
                </div>
                <div className="hidden md:flex gap-4 text-[10px] uppercase tracking-wider text-white/40 min-w-[200px] justify-end">
                  {lastQueryInfo ? (
                    <>
                      <div className="flex items-center gap-1">
                        <Target className="w-3 h-3" /> {lastQueryInfo.analyzed}{" "}
                        Scanned
                      </div>
                    </>
                  ) : (
                    <div className="opacity-0">Placeholder</div>
                  )}
                </div>
              </div>
            </div>

            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-6 space-y-4"
              style={{ scrollBehavior: "smooth" }}
            >
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                  style={{ animation: "fadeInUp 0.4s ease-out" }}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl ${
                      msg.role === "user"
                        ? "bg-purple-600 text-white rounded-tr-none"
                        : "bg-white/5 text-white border border-white/10 rounded-tl-none"
                    }`}
                  >
                    {renderMessageContent(msg)}
                  </div>
                </div>
              ))}

              {isTyping && typingMessage && (
                <div
                  className="flex justify-start"
                  style={{ animation: "fadeInUp 0.4s ease-out" }}
                >
                  <div className="max-w-[80%] p-4 rounded-2xl bg-white/5 text-white border border-white/10 rounded-tl-none">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {typingMessage}
                      <span className="inline-block w-1.5 h-4 bg-purple-400 ml-1 animate-pulse rounded" />
                    </p>
                  </div>
                </div>
              )}

              {isLoading && !isTyping && (
                <div
                  className="flex justify-start"
                  style={{ animation: "fadeInUp 0.4s ease-out" }}
                >
                  <div className="flex gap-2 p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                    <div
                      className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                    <div
                      className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.4s" }}
                    />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-white/5 bg-gray-900/80 shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g., Find me top 3 React developers..."
                  className="flex-1 bg-white/5 border border-white/10 text-white h-12 rounded-xl px-4 focus:outline-none focus:border-purple-500/50 transition-all placeholder:text-white/40"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  disabled={isLoading || isTyping}
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || isTyping || !input.trim()}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed h-12 px-6 rounded-xl transition-all flex items-center justify-center"
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="w-80 hidden lg:flex flex-col gap-4 shrink-0">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-blue-400" />
              <h3 className="text-white text-sm font-semibold">Database</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                <p className="text-[10px] text-white/40 uppercase">Total</p>
                <p className="text-xl font-bold text-white">
                  {stats.total_candidates}
                </p>
              </div>
              <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                <p className="text-[10px] text-white/40 uppercase">Skills</p>
                <p className="text-xl font-bold text-white">
                  {stats.unique_skills}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-400" />
                <h3 className="text-white text-sm font-semibold">
                  Suggestions
                </h3>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 text-black">
              {[
                "Top 5 Python Developers",
                "Top React Developers",
                "Machine Learning Experts",
                "Top 5 Web Developers based on projects, skills, and experience",
                "Best in Data Science/Analytics",
                "Candidates in a full-time position or who have interned from Top Companies",
              ].map((text, i) => (
                <button
                  key={i}
                  onClick={() => setInput(text)}
                  disabled={isLoading || isTyping}
                  className="w-full text-left p-3 rounded-lg bg-white/5 border border-white/5 hover:border-purple-500/50 hover:bg-purple-500/10 text-xs text-white/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default RecruiterChatbot;
