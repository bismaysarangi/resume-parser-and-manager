import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FileText,
  Upload,
  History,
  Brain,
  User,
  Mail,
  Calendar,
  TrendingUp,
  Award,
  BookOpen,
  Briefcase,
  Code,
  ArrowRight,
  BarChart3,
  Clock,
  CheckCircle,
} from "lucide-react";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({
    totalResumes: 0,
    recentResumes: 0,
    skillsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");

      // Fetch user profile
      const userResponse = await axios.get(
        "http://127.0.0.1:8000/api/v1/user/profile",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUser(userResponse.data);

      // Fetch resume history
      const historyResponse = await axios.get(
        "http://127.0.0.1:8000/api/candidate/resume-history",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setHistory(historyResponse.data);

      // Debug: Log the data structure
      console.log("Resume history data:", historyResponse.data);
      if (historyResponse.data.length > 0) {
        console.log("First resume:", historyResponse.data[0]);
        console.log(
          "First resume ai_insights:",
          historyResponse.data[0].ai_insights
        );
      }

      // Calculate stats
      calculateStats(historyResponse.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (resumeHistory) => {
    const totalResumes = resumeHistory.length;

    // Recent resumes (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentResumes = resumeHistory.filter(
      (item) => new Date(item.parsed_at) > oneWeekAgo
    ).length;

    // Calculate average skills count
    const totalSkills = resumeHistory.reduce((acc, item) => {
      return acc + (item.parsed_data.skills?.length || 0);
    }, 0);
    const averageSkills =
      totalResumes > 0 ? Math.round(totalSkills / totalResumes) : 0;

    // Calculate average AI score - only from resumes with scores
    const resumesWithScores = resumeHistory.filter(
      (item) => item.ai_insights?.overallScore > 0
    );
    const totalScore = resumesWithScores.reduce((acc, item) => {
      return acc + (item.ai_insights?.overallScore || 0);
    }, 0);
    const averageScore =
      resumesWithScores.length > 0
        ? Math.round(totalScore / resumesWithScores.length)
        : 0;

    setStats({
      totalResumes,
      recentResumes,
      averageScore,
      skillsCount: averageSkills,
    });
  };

  const getRecentResumes = () => {
    return history.slice(0, 3);
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "rgb(34, 24, 36)" }}
      >
        <div className="text-white text-xl">Loading Dashboard...</div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pt-24"
      style={{ backgroundColor: "rgb(34, 24, 36)" }}
    >
      {/* Header */}
      <header className="px-6 pb-8">
        <div className="container mx-auto max-w-7xl flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-white/60 mt-2">
              Welcome back, {user?.full_name || user?.username || "User"}!
            </p>
          </div>
          <Link to="/upload">
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-semibold">
              <Upload className="w-4 h-4 mr-2" />
              Upload Resume
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto max-w-7xl py-8 px-4">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Stats and Recent Activity */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-blue-600/10 to-cyan-600/5 backdrop-blur-sm border-blue-500/20 hover:border-blue-500/40 transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/60 text-sm font-medium">
                        Total Uploads
                      </p>
                      <p className="text-3xl font-bold text-white mt-2">
                        {stats.totalResumes}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                      <FileText className="w-6 h-6 text-blue-400" />
                    </div>
                  </div>
                  <div className="flex items-center mt-4 text-green-400 text-sm">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span>{stats.recentResumes} recent</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-600/10 to-pink-600/5 backdrop-blur-sm border-purple-500/20 hover:border-purple-500/40 transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/60 text-sm font-medium">
                        Recent Activity
                      </p>
                      <p className="text-3xl font-bold text-white mt-2">
                        {stats.recentResumes}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-500/20 rounded-lg">
                      <Clock className="w-6 h-6 text-purple-400" />
                    </div>
                  </div>
                  <p className="text-white/60 text-sm mt-4">Last 7 days</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-600/10 to-emerald-600/5 backdrop-blur-sm border-green-500/20 hover:border-green-500/40 transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/60 text-sm font-medium">
                        Avg. Skills
                      </p>
                      <p className="text-3xl font-bold text-white mt-2">
                        {stats.skillsCount}
                      </p>
                    </div>
                    <div className="p-3 bg-green-500/20 rounded-lg">
                      <Code className="w-6 h-6 text-green-400" />
                    </div>
                  </div>
                  <p className="text-white/60 text-sm mt-4">Per resume</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-white">
                  <Clock className="w-5 h-5 mr-2" />
                  Recent Resumes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {getRecentResumes().length > 0 ? (
                  <div className="space-y-4">
                    {getRecentResumes().map((item, index) => (
                      <div
                        key={item._id || `resume-${index}`}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:border-white/30 transition-all duration-200 hover:bg-white/8"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="p-2 bg-blue-500/20 rounded">
                            <FileText className="w-4 h-4 text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-white font-semibold text-sm">
                              {item.filename}
                            </h3>
                            <p className="text-white/60 text-xs">
                              Parsed {getTimeAgo(item.parsed_at)}
                            </p>
                            {item.parsed_data.name && (
                              <p className="text-white/70 text-xs mt-1">
                                {item.parsed_data.name}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="ml-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white transition-all duration-200 font-medium"
                          onClick={() =>
                            navigate("/parsed-results", {
                              state: {
                                parsedData: item.parsed_data,
                                fileName: item.filename,
                              },
                            })
                          }
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-white/40 mx-auto mb-4" />
                    <p className="text-white/60 mb-4">No resumes parsed yet</p>
                    <Link to="/upload">
                      <Button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-semibold">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload First Resume
                      </Button>
                    </Link>
                  </div>
                )}

                {history.length > 3 && (
                  <div className="mt-6 text-center">
                    <Link to="/history">
                      <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-semibold">
                        View All Resumes
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar Cards */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-white">
                  <Award className="w-5 h-5 mr-2" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/candidate/upload" className="block">
                  <Button className="w-full justify-start bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white transition-all duration-200 font-medium h-12">
                    <Upload className="w-4 h-4 mr-3" />
                    Upload New Resume
                  </Button>
                </Link>

                <Link to="/candidate/history" className="block">
                  <Button className="w-full justify-start bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white transition-all duration-200 font-medium h-12">
                    <History className="w-4 h-4 mr-3" />
                    View History
                  </Button>
                </Link>

                {history.length > 0 && (
                  <Link to="/candidate/ai-insights" className="block">
                    <Button className="w-full justify-start bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transition-all duration-200 font-medium h-12">
                      <Brain className="w-4 h-4 mr-3" />
                      Get AI Insights
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* Profile Summary */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-white">
                  <User className="w-5 h-5 mr-2" />
                  Profile Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded">
                    <User className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {user?.full_name || "Not set"}
                    </p>
                    <p className="text-white/60 text-sm">Full Name</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded">
                    <Mail className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{user?.email}</p>
                    <p className="text-white/60 text-sm">Email</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded">
                    <Calendar className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Member</p>
                    <p className="text-white/60 text-sm">Account Type</p>
                  </div>
                </div>
                <Link to="/candidate/profile">
                  <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white transition-all duration-200 font-medium h-12">
                    Edit Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Tips & Suggestions */}
            <Card className="bg-gradient-to-br from-purple-600/10 to-pink-600/5 backdrop-blur-sm border-purple-500/20">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-white">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Pro Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-white/80 text-sm">
                    Keep your resume updated with recent projects
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-white/80 text-sm">
                    Include measurable achievements in your experience
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-white/80 text-sm">
                    Use AI insights to identify skill gaps
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
