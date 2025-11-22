import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Brain,
  Star,
  Target,
  TrendingUp,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Briefcase,
  GraduationCap,
  Code,
  Award,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const AiInsights = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { parsedData, fileName } = location.state || {};
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (parsedData && !insights) {
      generateInsights();
    }
  }, [parsedData]);

  const generateInsights = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://127.0.0.1:8000/api/candidate/ai-insights",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ resume_data: parsedData }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate insights");
      }

      const data = await response.json();
      setInsights(data.insights);
    } catch (err) {
      setError(err.message);
      // Fallback to mock data for demo
      setInsights(generateMockInsights());
    } finally {
      setLoading(false);
    }
  };

  // Mock insights for demo purposes
  const generateMockInsights = () => {
    return {
      strengths: [
        "Strong educational background with relevant degrees",
        "Diverse technical skill set matching current market demands",
        "Progressive work experience showing career growth",
        "Project portfolio demonstrates practical application of skills",
      ],
      improvements: [
        "Consider adding more quantifiable achievements in experience section",
        "Include specific technologies and frameworks in projects",
        "Add links to GitHub repositories or live projects",
        "Consider obtaining industry certifications",
      ],
      skillGaps: {
        "Frontend Developer": [
          "Advanced React patterns",
          "State management",
          "Testing frameworks",
        ],
        "Full Stack Developer": [
          "Database optimization",
          "API design",
          "DevOps basics",
        ],
        "Tech Lead": [
          "Project management",
          "Team leadership",
          "System architecture",
        ],
      },
      careerSuggestions: [
        "Senior Software Engineer",
        "Full Stack Developer",
        "Technical Team Lead",
        "Solutions Architect",
      ],
      interviewTips: [
        "Prepare to discuss your most complex project in detail",
        "Practice explaining your technical decisions",
        "Be ready for system design questions",
        "Highlight your learning agility and adaptability",
      ],
      overallScore: 78,
      summary:
        "A solid technical profile with good foundation. Shows potential for senior roles with some additional specialization and demonstrated leadership experience.",
    };
  };

  if (!parsedData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <Brain className="w-16 h-16 text-white/60 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">
              No Resume Data
            </h2>
            <p className="text-white/70 mb-6">
              Please upload and parse a resume first.
            </p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2c0633] via-[#260b3b] to-[#461467] pt-16">
      {/* Main Content */}
      <div className="container mx-auto max-w-7xl py-6 sm:py-8 px-4 sm:px-6 mt-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
            <h3 className="text-white text-lg font-semibold mb-2">
              Analyzing Your Resume
            </h3>
            <p className="text-white/60 text-center">
              Our AI is generating personalized career insights...
            </p>
          </div>
        ) : error ? (
          <Card className="bg-red-500/10 border-red-500/20 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-white text-lg font-semibold mb-2">
                Analysis Failed
              </h3>
              <p className="text-white/70 mb-4">{error}</p>
              <Button
                onClick={generateInsights}
                className="bg-red-600 hover:bg-red-700"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : insights ? (
          <div className="space-y-6">
            {/* Overall Score */}
            <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm border-white/20">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xl font-bold">
                          {insights.overallScore}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <h2 className="text-white text-xl font-bold mb-2">
                        Resume Score
                      </h2>
                      <p className="text-white/70 text-sm">
                        {insights.summary}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge
                      variant="secondary"
                      className="bg-green-500/20 text-green-300"
                    >
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Strong Potential
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Strengths */}
              <Card className="bg-white/10 backdrop-blur-sm border-green-500/20 hover:border-green-400/30 transition-all">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-white text-lg">
                    <div className="p-2 bg-green-500/20 rounded-lg mr-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                    Key Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {insights.strengths.map((strength, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-green-500/5 rounded-lg"
                      >
                        <Star className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                        <p className="text-white/90 text-sm">{strength}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Areas for Improvement */}
              <Card className="bg-white/10 backdrop-blur-sm border-yellow-500/20 hover:border-yellow-400/30 transition-all">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-white text-lg">
                    <div className="p-2 bg-yellow-500/20 rounded-lg mr-3">
                      <Lightbulb className="w-5 h-5 text-yellow-400" />
                    </div>
                    Improvement Areas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {insights.improvements.map((improvement, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-yellow-500/5 rounded-lg"
                      >
                        <Target className="w-4 h-4 text-yellow-400 mt-1 flex-shrink-0" />
                        <p className="text-white/90 text-sm">{improvement}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Career Suggestions */}
              <Card className="bg-white/10 backdrop-blur-sm border-blue-500/20 hover:border-blue-400/30 transition-all">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-white text-lg">
                    <div className="p-2 bg-blue-500/20 rounded-lg mr-3">
                      <Briefcase className="w-5 h-5 text-blue-400" />
                    </div>
                    Career Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {insights.careerSuggestions.map((role, index) => (
                      <Badge
                        key={index}
                        className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 px-3 py-1"
                      >
                        {role}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Interview Tips */}
              <Card className="bg-white/10 backdrop-blur-sm border-purple-500/20 hover:border-purple-400/30 transition-all">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-white text-lg">
                    <div className="p-2 bg-purple-500/20 rounded-lg mr-3">
                      <User className="w-5 h-5 text-purple-400" />
                    </div>
                    Interview Preparation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {insights.interviewTips.map((tip, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-purple-500/5 rounded-lg"
                      >
                        <Clock className="w-4 h-4 text-purple-400 mt-1 flex-shrink-0" />
                        <p className="text-white/90 text-sm">{tip}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Skill Gaps */}
            <Card className="bg-white/10 backdrop-blur-sm border-orange-500/20 hover:border-orange-400/30 transition-all">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-white text-lg">
                  <div className="p-2 bg-orange-500/20 rounded-lg mr-3">
                    <Code className="w-5 h-5 text-orange-400" />
                  </div>
                  Skill Gap Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(insights.skillGaps).map(([role, gaps]) => (
                    <div key={role} className="bg-orange-500/5 rounded-lg p-4">
                      <h4 className="text-white font-semibold mb-3 text-sm">
                        {role}
                      </h4>
                      <div className="space-y-2">
                        {gaps.map((gap, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <AlertTriangle className="w-3 h-3 text-orange-400 flex-shrink-0" />
                            <span className="text-white/70 text-xs">{gap}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                onClick={() => navigate("/candidate/upload")}
              >
                Upload Another Resume
              </Button>
              <Button
                variant="outline"
                className="border-white/20 text-black hover:bg-white/10"
                onClick={() =>
                  navigate("/candidate/parsed-results", {
                    state: { parsedData, fileName },
                  })
                }
              >
                Back to Resume Details
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AiInsights;
