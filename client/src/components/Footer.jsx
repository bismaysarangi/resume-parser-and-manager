import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaEnvelope, FaGithub, FaLinkedin, FaInstagram } from "react-icons/fa";
import {
  Upload,
  FileText,
  Brain,
  Clock,
  BarChart3,
  Users,
  Building2,
  MessageSquareMore,
  Info,
  User,
} from "lucide-react";

export default function Footer() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [email, setEmail] = useState("");

  // Check authentication status
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem("token");
      setIsLoggedIn(!!token);

      // If logged in, fetch user profile
      if (token) {
        await fetchUserProfile(token);
      } else {
        setUserProfile(null);
      }
    };

    checkAuthStatus();

    // Listen for custom auth events
    const handleAuthChange = () => {
      checkAuthStatus();
    };

    // Listen for storage changes (logout from another tab)
    const handleStorageChange = () => {
      checkAuthStatus();
    };

    window.addEventListener("authStatusChanged", handleAuthChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("authStatusChanged", handleAuthChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const fetchUserProfile = async (token) => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const profile = await response.json();
        setUserProfile(profile);
      } else {
        localStorage.removeItem("token");
        setIsLoggedIn(false);
        setUserProfile(null);
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      localStorage.removeItem("token");
      setIsLoggedIn(false);
      setUserProfile(null);
    }
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    // Add your subscription logic here
    console.log("Subscribing email:", email);
    setEmail("");
  };

  // Navigation items based on auth status and role
  const publicNavItems = [
    { to: "/", label: "Home" },
    { to: "/about", label: "About", icon: Info },
  ];

  const candidateNavItems = [
    { to: "/candidate/upload", label: "Upload", icon: Upload },
    { to: "/candidate/parsed-results", label: "Results", icon: FileText },
    { to: "/candidate/ai-insights", label: "AI Insights", icon: Brain },
    { to: "/candidate/history", label: "History", icon: Clock },
    { to: "/candidate/dashboard", label: "Dashboard", icon: BarChart3 },
    { to: "/candidate/profile", label: "Profile", icon: User },
  ];

  const recruiterNavItems = [
    { to: "/recruiter/bulk-upload", label: "Bulk Upload", icon: Upload },
    { to: "/recruiter/candidates", label: "Candidates", icon: Users },
    { to: "/recruiter/bulk-results", label: "Results", icon: FileText },
    { to: "/recruiter/chatbot", label: "Chatbot", icon: MessageSquareMore },
    { to: "/recruiter/profile", label: "Profile", icon: Building2 },
  ];

  // Determine which nav items to show
  const getNavItems = () => {
    if (!isLoggedIn) return publicNavItems;
    if (userProfile?.role === "recruiter") return recruiterNavItems;
    return candidateNavItems;
  };

  const navItems = getNavItems();

  return (
    <footer className="bg-[rgb(45,32,54)] text-gray-300 py-10 border-t border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Branding Section */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              {userProfile?.role === "recruiter" ? (
                <Building2 className="h-6 w-6 text-white" />
              ) : (
                <FileText className="h-6 w-6 text-white" />
              )}
              <h2 className="text-2xl font-bold text-white">Resume Parser</h2>
            </div>
            <p className="text-sm text-gray-400 max-w-sm">
              {userProfile?.role === "recruiter"
                ? "Streamline your recruitment process with AI-powered resume parsing and candidate management."
                : "AI-powered resume parsing and management system helping professionals streamline their career growth and job search."}
            </p>
            <div className="flex space-x-4 mt-4">
              <a
                href="mailto:support@resumeparser.com"
                className="text-gray-400 hover:text-white transition"
                aria-label="Email"
              >
                <FaEnvelope size={20} />
              </a>
              <a
                href="https://github.com/your-github-profile"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition"
                aria-label="GitHub"
              >
                <FaGithub size={20} />
              </a>
              <a
                href="https://linkedin.com/in/your-linkedin-profile"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition"
                aria-label="LinkedIn"
              >
                <FaLinkedin size={20} />
              </a>
              <a
                href="https://instagram.com/your-instagram-profile"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition"
                aria-label="Instagram"
              >
                <FaInstagram size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links Section - Dynamic based on role */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              {navItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className="flex items-center space-x-2 hover:text-white transition group"
                    >
                      {IconComponent && <IconComponent className="h-4 w-4" />}
                      <span className="relative">
                        {item.label}
                        <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-white transition-all duration-300 group-hover:w-full"></span>
                      </span>
                    </Link>
                  </li>
                );
              })}
              {!isLoggedIn && (
                <>
                  <li>
                    <Link
                      to="/login"
                      className="flex items-center space-x-2 hover:text-white transition group"
                    >
                      <span className="relative">
                        Login
                        <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-white transition-all duration-300 group-hover:w-full"></span>
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/signup"
                      className="flex items-center space-x-2 hover:text-white transition group"
                    >
                      <span className="relative">
                        Sign Up
                        <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-white transition-all duration-300 group-hover:w-full"></span>
                      </span>
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Stay Updated Section */}
          <div>
            <h3 className="text-white font-semibold mb-4">Stay Updated</h3>
            <p className="text-sm text-gray-400 mb-4">
              {userProfile?.role === "recruiter"
                ? "Get the latest recruitment insights and platform updates delivered to your inbox."
                : "Get the latest parsing features and career insights delivered to your inbox."}
            </p>
            <div className="flex space-x-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-3 py-2 rounded-md bg-[rgb(45,32,54)] border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleSubscribe}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-md hover:opacity-90 transition"
              >
                Subscribe
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              No spam. Unsubscribe anytime.
            </p>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="text-center text-gray-500 text-xs mt-10 pt-6 border-t border-white/10">
          <p>
            © {new Date().getFullYear()} Resume Parser. All rights reserved.
            {isLoggedIn && userProfile && (
              <span className="ml-2">
                • Logged in as{" "}
                <span className="text-gray-400">
                  {userProfile.full_name || userProfile.username}
                </span>{" "}
                ({userProfile.role})
              </span>
            )}
          </p>
        </div>
      </div>
    </footer>
  );
}
