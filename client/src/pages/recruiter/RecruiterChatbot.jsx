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
  Send,
  Bot,
  ArrowLeft,
  Users,
  Sparkles,
  MessageCircle,
  Lightbulb,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:8000";

const RecruiterChatbot = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_candidates: 0,
    unique_skills: 0,
  });
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I'm your AI-powered candidate search assistant. I have access to all your candidate data and can help you find the perfect match for any role.\n\nTry asking me:\n• 'Find top 5 candidates with Python skills'\n• 'Who has worked at Google or Microsoft?'\n• 'Show me candidates with 5+ years of experience'\n• 'Find full-stack developers with React'\n• 'Who knows machine learning?'\n\nWhat would you like to know about your candidates?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/recruiter/chatbot/stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const searchCandidates = async (query) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return "Please log in to continue.";
      }

      const response = await fetch(`${API_BASE_URL}/api/recruiter/chatbot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: query,
          conversation_history: messages,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to process query");
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error("Chatbot error:", error);
      return `I apologize, but I encountered an error: ${error.message}. Please try again.`;
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await searchCandidates(input);
      const assistantMessage = { role: "assistant", content: response };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = {
        role: "assistant",
        content: "I apologize, but I encountered an error. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
  };

  const suggestions = [
    "Find top 5 candidates with Python skills",
    "Who knows React and Node.js?",
    "Show me full-stack developers",
    "Find candidates with 5+ years experience",
    "Who has machine learning skills?",
    "Find candidates from top companies",
  ];

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
              Loading AI Assistant...
            </h2>
            <p className="text-white/70">Preparing your candidate data</p>
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
      <div className="container mx-auto max-w-6xl py-6 px-4 mt-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                className="text-white/60 hover:text-white hover:bg-white/10"
                onClick={() => navigate("/recruiter/candidates")}
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Candidates
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-600/20 rounded-xl border border-purple-500/30">
              <Bot className="w-10 h-10 text-purple-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">
                AI Candidate Assistant
              </h1>
              <p className="text-white/60 text-lg mt-1">
                Powered by Groq AI • {stats.total_candidates} candidates in database
              </p>
            </div>
          </div>
        </div>

        {/* Main Chat Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Area */}
          <div className="lg:col-span-2">
            <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-white/20 h-[calc(100vh-280px)] flex flex-col">
              <CardHeader className="border-b border-white/10 flex-shrink-0">
                <CardTitle className="flex items-center text-white text-xl">
                  <MessageCircle className="w-6 h-6 text-purple-400 mr-2" />
                  Conversation
                </CardTitle>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] ${
                        msg.role === "user"
                          ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl rounded-tr-sm"
                          : "bg-white/10 text-white rounded-2xl rounded-tl-sm"
                      } p-4 shadow-lg`}
                    >
                      {msg.role === "assistant" && (
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-1.5 bg-purple-500/20 rounded-lg">
                            <Bot className="w-4 h-4 text-purple-400" />
                          </div>
                          <span className="text-xs text-white/60 font-semibold uppercase tracking-wide">
                            AI Assistant
                          </span>
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/10 rounded-2xl rounded-tl-sm p-4 shadow-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                        <div
                          className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.4s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Input Area */}
              <div className="border-t border-white/10 p-6 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <Input
                    type="text"
                    placeholder="Ask about candidates..."
                    className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-purple-400 focus:ring-purple-400 text-base py-6"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                  />
                  <Button
                    className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-8 py-6"
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border-blue-500/20">
              <CardHeader>
                <CardTitle className="flex items-center text-white text-lg">
                  <Users className="w-5 h-5 text-blue-400 mr-2" />
                  Database Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-white/70 text-sm">Total Candidates</span>
                  <span className="text-white font-bold text-xl">
                    {stats.total_candidates}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-white/70 text-sm">Unique Skills</span>
                  <span className="text-white font-bold text-xl">
                    {stats.unique_skills}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Suggested Queries */}
            <Card className="bg-gradient-to-br from-purple-600/10 to-pink-600/10 border-purple-500/20">
              <CardHeader>
                <CardTitle className="flex items-center text-white text-lg">
                  <Lightbulb className="w-5 h-5 text-yellow-400 mr-2" />
                  Try Asking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-400/30 rounded-lg text-white/80 hover:text-white text-sm transition-all"
                    disabled={isLoading}
                  >
                    {suggestion}
                  </button>
                ))}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterChatbot;