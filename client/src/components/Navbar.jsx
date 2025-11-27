import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import {
  Menu,
  X,
  User,
  Upload,
  FileText,
  Brain,
  LogOut,
  Info,
  Clock,
  BarChart3,
  Users,
  Building2,
} from "lucide-react";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const navigate = useNavigate();

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
  }, [navigate]);

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
        // Token might be invalid, remove it
        localStorage.removeItem("token");
        setIsLoggedIn(false);
        setUserProfile(null);
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      // On error, assume token is invalid
      localStorage.removeItem("token");
      setIsLoggedIn(false);
      setUserProfile(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setUserProfile(null);
    setIsMobileMenuOpen(false);

    window.dispatchEvent(new Event("authStatusChanged"));

    navigate("/");
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  // Navigation items based on auth status and role
  const publicNavItems = [{ to: "/about", label: "About", icon: Info }];

  const candidateNavItems = [
    { to: "/candidate/upload", label: "Upload", icon: Upload },
    { to: "/candidate/parsed-results", label: "Results", icon: FileText },
    { to: "/candidate/ai-insights", label: "AI Insights", icon: Brain },
    { to: "/candidate/history", label: "History", icon: Clock },
    { to: "/candidate/dashboard", label: "Dashboard", icon: BarChart3 },
  ];

  const recruiterNavItems = [
    { to: "/recruiter/bulk-upload", label: "Bulk Upload", icon: Upload },
    { to: "/recruiter/candidates", label: "Candidates", icon: Users },
    { to: "recruiter/bulk-results", label: "Results", icon: FileText },
  ];

  // Determine which nav items to show
  const getNavItems = () => {
    if (!isLoggedIn) return publicNavItems;
    if (userProfile?.role === "recruiter") return recruiterNavItems;
    return candidateNavItems;
  };

  const navItems = getNavItems();

  // Get profile link based on role
  const getProfileLink = () => {
    if (!userProfile) return "/profile";
    return userProfile.role === "recruiter"
      ? "/recruiter/profile"
      : "/candidate/profile";
  };

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "backdrop-blur-xl border-b border-white/10 shadow-lg"
          : "backdrop-blur-md border-b border-white/10"
      }`}
      style={{ backgroundColor: "rgb(45, 32, 54)" }}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link
              to="/"
              className="flex items-center text-xl font-semibold text-white hover:text-white/80 transition-all duration-300 hover:tracking-wide"
            >
              {userProfile?.role === "recruiter" ? (
                <Building2 className="h-5 w-5 mr-2" />
              ) : (
                <FileText className="h-5 w-5 mr-2" />
              )}
              <span>Resume Parser</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center space-x-1 text-white/80 hover:text-white transition-all duration-300 text-sm font-medium relative group"
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{item.label}</span>
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-white transition-all duration-300 group-hover:w-full"></span>
                </Link>
              );
            })}
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoggedIn ? (
              <div className="flex items-center space-x-4">
                {/* Role Badge */}
                {userProfile?.role && (
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-md text-xs text-white/70">
                    {userProfile.role === "recruiter" ? (
                      <>
                        <Building2 className="h-3 w-3" />
                        <span>Recruiter</span>
                      </>
                    ) : (
                      <>
                        <User className="h-3 w-3" />
                        <span>Candidate</span>
                      </>
                    )}
                  </div>
                )}

                {/* Profile Button */}
                <Link
                  to={getProfileLink()}
                  className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/40 backdrop-blur-sm transition-all duration-300 px-4 py-2 rounded-md text-sm"
                >
                  <User className="h-4 w-4" />
                  <span>
                    {userProfile?.full_name ||
                      userProfile?.username ||
                      "Profile"}
                  </span>
                </Link>

                {/* Logout Button */}
                <Button
                  onClick={handleLogout}
                  size="sm"
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-400/30 hover:border-red-400/50 backdrop-blur-sm transition-all duration-300"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <>
                <Button
                  asChild
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/40 backdrop-blur-sm transition-all duration-300"
                >
                  <Link to="/login">Login</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/40 backdrop-blur-sm transition-all duration-300"
                >
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:text-white hover:bg-white/10 p-2 touch-manipulation relative"
                  aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                >
                  <Menu
                    className={`h-6 w-6 transition-all duration-300 ${
                      isMobileMenuOpen
                        ? "rotate-90 opacity-0"
                        : "rotate-0 opacity-100"
                    }`}
                  />
                  <X
                    className={`h-6 w-6 absolute inset-0 transition-all duration-300 ${
                      isMobileMenuOpen
                        ? "rotate-0 opacity-100"
                        : "-rotate-90 opacity-0"
                    }`}
                  />
                </Button>
              </SheetTrigger>

              <SheetContent
                side="right"
                className="w-80 bg-[rgb(45, 32, 54)] backdrop-blur-xl border-l border-white/20 p-0 [&>button]:text-white [&>button]:hover:text-gray-300 [&>button]:top-4 [&>button]:right-4"
              >
                <div className="flex flex-col h-full">
                  {/* Mobile Header */}
                  <div className="p-6 border-b border-white/20">
                    <div className="flex items-center space-x-2">
                      {userProfile?.role === "recruiter" ? (
                        <Building2 className="w-6 h-6 text-white" />
                      ) : (
                        <FileText className="w-6 h-6 text-white" />
                      )}
                      <span className="text-xl font-bold text-white">
                        Resume Parser
                      </span>
                    </div>
                    {isLoggedIn && userProfile && (
                      <div className="mt-3">
                        <div className="text-sm text-white/60">
                          Welcome,{" "}
                          {userProfile.full_name || userProfile.username}
                        </div>
                        <div className="flex items-center space-x-1 mt-2 text-xs text-white/50">
                          {userProfile.role === "recruiter" ? (
                            <>
                              <Building2 className="h-3 w-3" />
                              <span>Recruiter Account</span>
                            </>
                          ) : (
                            <>
                              <User className="h-3 w-3" />
                              <span>Candidate Account</span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mobile Navigation Links */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-2">
                    <div className="text-sm font-semibold text-white/60 mb-6 uppercase tracking-wide">
                      Navigation
                    </div>

                    {navItems.map((item) => {
                      const IconComponent = item.icon;
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          className="flex items-center px-4 py-4 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 touch-manipulation relative group"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <IconComponent className="w-5 h-5 mr-3" />
                          {item.label}
                          <span className="absolute left-0 right-0 bottom-2 mx-auto w-0 h-px bg-white transition-all duration-300 group-hover:w-4/5"></span>
                        </Link>
                      );
                    })}

                    {/* Profile link for logged in users */}
                    {isLoggedIn && (
                      <Link
                        to={getProfileLink()}
                        className="flex items-center px-4 py-4 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 touch-manipulation relative group"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <User className="w-5 h-5 mr-3" />
                        Profile
                        <span className="absolute left-0 right-0 bottom-2 mx-auto w-0 h-px bg-white transition-all duration-300 group-hover:w-4/5"></span>
                      </Link>
                    )}
                  </div>

                  {/* Mobile Auth Section */}
                  <div className="p-6 border-t border-white/20">
                    {isLoggedIn ? (
                      <Button
                        onClick={handleLogout}
                        className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-400/30 hover:border-red-400/50 backdrop-blur-sm transition-all duration-200 touch-manipulation h-12 text-base font-medium"
                      >
                        <LogOut className="w-5 h-5 mr-2" />
                        Logout
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <Button
                          asChild
                          className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/40 backdrop-blur-sm transition-all duration-200 touch-manipulation h-12 text-base font-medium"
                        >
                          <Link
                            to="/login"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            Login
                          </Link>
                        </Button>

                        <Button
                          asChild
                          className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/40 backdrop-blur-sm transition-all duration-200 touch-manipulation h-12 text-base font-medium"
                        >
                          <Link
                            to="/signup"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            Sign Up
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
