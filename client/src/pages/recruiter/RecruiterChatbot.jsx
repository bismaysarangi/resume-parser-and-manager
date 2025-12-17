import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Send,
  Bot,
  ArrowLeft,
  Users,
  Sparkles,
  MessageCircle,
  Lightbulb,
  TrendingUp,
  Award,
  Target,
  Code,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:8000";

const RecruiterChatbot = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total_candidates: 0, unique_skills: 0 });
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I'm your AI-powered candidate search assistant. I analyze all profiles and rank them by relevance. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastQueryInfo, setLastQueryInfo] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

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
        }
      );
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
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
          conversation_history: messages,
        }),
      });

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);

      if (data.ranking_applied) {
        setLastQueryInfo({
          analyzed: data.candidates_analyzed,
          shown: data.candidates_shown,
          intent: data.intent_detected || {},
        });
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error processing request." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#221824] flex items-center justify-center text-white">
        Loading...
      </div>
    );

  return (
    <div className="h-screen flex flex-col bg-[#221824] overflow-hidden">
      {/* Top Navigation - Fixed Height */}
      <nav className="h-16 border-b border-white/10 flex items-center px-6 shrink-0">
        <Button
          variant="ghost"
          className="text-white/60 hover:text-white"
          onClick={() => navigate("/recruiter/candidates")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </nav>

      <div className="flex-1 flex overflow-hidden container mx-auto max-w-7xl py-6 gap-6">
        {/* Left Side: Chat (Takes up most space) */}
        <div className="flex-1 flex flex-col min-w-0">
          <Card className="flex-1 flex flex-col bg-gray-900/50 border-white/10 overflow-hidden">
            <CardHeader className="border-b border-white/5 bg-gray-900/80 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bot className="w-6 h-6 text-purple-400" />
                  <div>
                    <CardTitle className="text-white text-lg">
                      AI Candidate Assistant
                    </CardTitle>
                    <p className="text-xs text-white/50">
                      Smart Ranking Active
                    </p>
                  </div>
                </div>
                {/* Ranking Info moved INSIDE header to prevent shifting main content */}
                {lastQueryInfo && (
                  <div className="hidden md:flex gap-4 text-[10px] uppercase tracking-wider text-white/40">
                    <div className="flex items-center gap-1">
                      <Target className="w-3 h-3" /> {lastQueryInfo.analyzed}{" "}
                      Scanned
                    </div>
                    <div className="flex items-center gap-1">
                      <Award className="w-3 h-3" /> {lastQueryInfo.shown} Ranked
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>

            {/* Scrollable Message Area */}
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl ${
                      msg.role === "user"
                        ? "bg-purple-600 text-white rounded-tr-none"
                        : "bg-white/5 text-white border border-white/10 rounded-tl-none"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2 p-4 bg-white/5 w-fit rounded-xl animate-pulse">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </CardContent>

            {/* Fixed Bottom Input Area */}
            <div className="p-4 border-t border-white/5 bg-gray-900/80 shrink-0">
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Find me top 3 React developers..."
                  className="bg-white/5 border-white/10 text-white h-12"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="bg-purple-600 hover:bg-purple-700 h-12 px-6"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Side: Stats & Suggestions (Fixed Width) */}
        <div className="w-80 hidden lg:flex flex-col gap-4 shrink-0">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" /> Database
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
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
            </CardContent>
          </Card>

          <Card className="flex-1 bg-white/5 border-white/10 overflow-hidden flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-400" /> Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 overflow-y-auto">
              {[
                "Top 5 Python Developers",
                "Top React Developers",
                "Machine Learning Experts",
                "Fullstack with 5+ years",
                "Best in Data Science/Analytics",
                "Candidates from Top Companies",
              ].map((text, i) => (
                <button
                  key={i}
                  onClick={() => setInput(text)}
                  className="w-full text-left p-3 rounded-lg bg-white/5 border border-white/5 hover:border-purple-500/50 hover:bg-purple-500/10 text-xs text-white/70 transition-all"
                >
                  {text}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RecruiterChatbot;
