import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Upload,
  Brain,
  Shield,
  MessageCircle,
  CheckCircle,
  Zap,
  Users,
  ArrowRight,
  Sparkles,
  FileText,
  User,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const LandingPage = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const AnimatedText = ({ text, delay = 0 }) => {
    return (
      <span className="inline-block">
        {text.split("").map((char, index) => (
          <span
            key={index}
            className={`inline-block transition-all duration-700 ease-out ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
            style={{
              transitionDelay: `${delay + index * 30}ms`,
            }}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </span>
    );
  };

  const features = [
    {
      icon: <Upload className="w-8 h-8" />,
      title: "Smart Resume Parsing",
      description:
        "Upload resumes in any format and extract structured data instantly with our advanced parsing technology.",
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI-Powered Insights",
      description:
        "Get intelligent recommendations and insights about candidates with our machine learning algorithms.",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Secure Storage",
      description:
        "Your data is protected with enterprise-grade security and compliance standards.",
    },
    {
      icon: <MessageCircle className="w-8 h-8" />,
      title: "Chatbot Support",
      description:
        "Get instant help and answers with our intelligent chatbot assistant available 24/7.",
    },
  ];

  const benefits = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Lightning Fast",
      description: "Process hundreds of resumes in seconds, not hours.",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Team Collaboration",
      description:
        "Share and collaborate on candidate profiles with your team.",
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: "99% Accuracy",
      description: "Industry-leading parsing accuracy for reliable results.",
    },
  ];

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "rgb(34, 24, 36)" }}
      >
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section - Main Color Scheme */}
      <section
        className="relative pt-24 pb-20 px-4 overflow-hidden"
        style={{
          backgroundColor: "rgb(34, 24, 36)",
          background: "rgb(34, 24, 36)",
        }}
      >
        <div className="container mx-auto max-w-6xl">
          <div className="text-center">
            <div
              className={`transition-all duration-1000 ease-out ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-4"
              }`}
            >
              <div
                className="inline-flex items-center px-4 py-2 rounded-full backdrop-blur-sm border border-white/20 mb-8 animate-pulse"
                style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
              >
                <Sparkles className="w-4 h-4 text-white mr-2" />
                <span className="text-white text-sm font-medium">
                  <AnimatedText text="Powered by Advanced AI" delay={0} />
                </span>
              </div>
            </div>

            <div className="mb-6">
              <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
                <AnimatedText text="Resume Parser &" delay={200} />
                <br />
                <span className="text-white/90">
                  <AnimatedText text="Manager" delay={800} />
                </span>
              </h1>
            </div>

            <div
              className={`transition-all duration-1000 delay-1200 ease-out ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
            >
              <p className="text-xl md:text-2xl text-white/70 mb-8 max-w-3xl mx-auto leading-relaxed">
                {user ? (
                  <>
                    Welcome back, {user.username}! Continue managing your{" "}
                    {user.role === "recruiter" ? "recruitment" : "career"} with
                    our AI-powered platform.
                  </>
                ) : (
                  <>
                    Upload, parse, and manage resumes with ease. Our AI-powered
                    platform transforms your hiring process with intelligent
                    insights and secure storage.
                  </>
                )}
              </p>
            </div>

            <div
              className={`transition-all duration-1000 delay-1500 ease-out ${
                isVisible
                  ? "opacity-100 translate-y-0 scale-100"
                  : "opacity-0 translate-y-4 scale-95"
              }`}
            >
              <div className="flex justify-center">
                {user ? (
                  user.role === "recruiter" ? (
                    <Link to="/recruiter/dashboard">
                      <Button
                        size="lg"
                        className="bg-white text-black hover:bg-white/90 transition-all duration-300 px-8 py-6 text-lg font-semibold group hover:scale-105 shadow-lg"
                      >
                        <Users className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:rotate-12" />
                        Recruiter Dashboard
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/upload">
                      <Button
                        size="lg"
                        className="bg-white text-black hover:bg-white/90 transition-all duration-300 px-8 py-6 text-lg font-semibold group hover:scale-105 shadow-lg"
                      >
                        <Upload className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:rotate-12" />
                        Upload Resume
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                      </Button>
                    </Link>
                  )
                ) : (
                  <Link to="/login">
                    <Button
                      size="lg"
                      className="bg-white text-black hover:bg-white/90 transition-all duration-300 px-8 py-6 text-lg font-semibold group hover:scale-105 shadow-lg"
                    >
                      <User className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:rotate-12" />
                      Sign In
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-white/3 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
      </section>

      {/* Features Section - Lighter variation */}
      <section
        className="py-20 px-4"
        style={{
          backgroundColor: "rgb(44, 34, 46)",
          background: "rgb(44, 34, 46)",
        }}
      >
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              {user ? "Your Tools" : "Powerful Features"}
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              {user
                ? user.role === "recruiter"
                  ? "Access all the tools you need to manage your recruitment process effectively."
                  : "Access all the tools you need to enhance your career profile."
                : "Everything you need to streamline your recruitment process and make better hiring decisions."}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300 group hover:scale-105"
              >
                <CardContent className="p-6">
                  <div className="text-white/80 mb-4 group-hover:text-white transition-colors duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-white/70 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section - Medium variation */}
      <section
        className="py-20 px-4"
        style={{
          backgroundColor: "rgb(54, 44, 56)",
          background: "rgb(54, 44, 56)",
        }}
      >
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Why Choose Us?
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              {user
                ? "You've already made the right choice! Here's why thousands trust our platform."
                : "Join thousands of companies who trust our platform for their recruitment needs."}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6 group-hover:bg-white/20 transition-all duration-300 mx-auto">
                  <div className="text-white/80 group-hover:text-white transition-colors duration-300">
                    {benefit.icon}
                  </div>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-4">
                  {benefit.title}
                </h3>
                <p className="text-white/70 text-lg leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Darker variation */}
      <section
        className="py-20 px-4"
        style={{
          backgroundColor: "rgb(24, 14, 26)",
          background: "rgb(24, 14, 26)",
        }}
      >
        <div className="container mx-auto max-w-4xl">
          <Card
            className="backdrop-blur-sm border-white/20 hover:scale-105 transition-transform duration-500"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
          >
            <CardContent className="p-12 text-center">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                {user
                  ? user.role === "recruiter"
                    ? "Ready to Find Top Talent?"
                    : "Ready to Continue Your Work?"
                  : "Ready to Transform Your Hiring?"}
              </h2>
              <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
                {user
                  ? user.role === "recruiter"
                    ? "Browse our candidate database and find the perfect fit for your team."
                    : "Access your dashboard and continue managing your resumes with our powerful tools."
                  : "Start parsing resumes smarter, not harder. Join our platform today and experience the future of recruitment."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  user.role === "recruiter" ? (
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Link to="/recruiter/candidates">
                        <Button
                          size="lg"
                          className="bg-white text-black hover:bg-white/90 transition-all duration-300 px-8 py-6 text-lg font-semibold hover:scale-105 shadow-lg"
                        >
                          <Users className="w-5 h-5 mr-2" />
                          Browse Candidates
                        </Button>
                      </Link>
                      <Link to="/recruiter/dashboard">
                        <Button
                          variant="outline"
                          size="lg"
                          className="bg-transparent hover:bg-white/10 text-white border-white/30 hover:border-white/50 px-8 py-6 text-lg font-semibold hover:scale-105 transition-all duration-300"
                        >
                          <FileText className="w-5 h-5 mr-2" />
                          Dashboard
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Link to="/upload">
                        <Button
                          size="lg"
                          className="bg-white text-black hover:bg-white/90 transition-all duration-300 px-8 py-6 text-lg font-semibold hover:scale-105 shadow-lg"
                        >
                          <Upload className="w-5 h-5 mr-2" />
                          Upload Resume
                        </Button>
                      </Link>
                      <Link to="/parsed-results">
                        <Button
                          variant="outline"
                          size="lg"
                          className="bg-transparent hover:bg-white/10 text-white border-white/30 hover:border-white/50 px-8 py-6 text-lg font-semibold hover:scale-105 transition-all duration-300"
                        >
                          <FileText className="w-5 h-5 mr-2" />
                          View Results
                        </Button>
                      </Link>
                    </div>
                  )
                ) : (
                  <>
                    <Link to="/login">
                      <Button
                        size="lg"
                        className="bg-white text-black hover:bg-white/90 transition-all duration-300 px-8 py-6 text-lg font-semibold hover:scale-105 shadow-lg"
                      >
                        <User className="w-5 h-5 mr-2" />
                        Sign In
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="lg"
                      className="bg-transparent hover:bg-white/10 text-white border-white/30 hover:border-white/50 px-8 py-6 text-lg font-semibold hover:scale-105 transition-all duration-300"
                    >
                      Learn More
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
