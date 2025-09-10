import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { Menu, X, User, Upload, Home, FileText } from "lucide-react";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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
          <div className="flex-shrink-0">
            <Link
              to="/"
              className="flex items-center text-xl font-semibold text-white hover:text-white/80 transition-all duration-300 hover:tracking-wide"
            >
              <FileText className="h-5 w-5 mr-2" />
              <span>Resume Parser</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/parser"
              className="text-white/80 hover:text-white transition-all duration-300 text-sm font-medium relative group"
            >
              Parser
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-white transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link
              to="/upload"
              className="text-white/80 hover:text-white transition-all duration-300 text-sm font-medium relative group"
            >
              Upload
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-white transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link
              to="/profile"
              className="text-white/80 hover:text-white transition-all duration-300 text-sm font-medium relative group"
            >
              Profile
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-white transition-all duration-300 group-hover:w-full"></span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Button
              asChild
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/40 backdrop-blur-sm transition-all duration-300"
            >
              <Link to="/login">Login</Link>
            </Button>
            <Button
              asChild
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/40 backdrop-blur-sm transition-all duration-300"
            >
              <Link to="/signup">Sign Up</Link>
            </Button>
          </div>

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
                  <div className="p-6 border-b border-white/20">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-6 h-6 text-white" />
                      <span className="text-xl font-bold text-white">
                        Resume Parser
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-2">
                    <div className="text-sm font-semibold text-white/60 mb-6 uppercase tracking-wide">
                      Navigation
                    </div>

                    <Link
                      to="/parser"
                      className="flex items-center px-4 py-4 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 touch-manipulation relative group"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <FileText className="w-5 h-5 mr-3" />
                      Parser
                      <span className="absolute left-0 right-0 bottom-2 mx-auto w-0 h-px bg-white transition-all duration-300 group-hover:w-4/5"></span>
                    </Link>

                    <Link
                      to="/upload"
                      className="flex items-center px-4 py-4 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 touch-manipulation relative group"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Upload className="w-5 h-5 mr-3" />
                      Upload
                      <span className="absolute left-0 right-0 bottom-2 mx-auto w-0 h-px bg-white transition-all duration-300 group-hover:w-4/5"></span>
                    </Link>

                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-4 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 touch-manipulation relative group"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <User className="w-5 h-5 mr-3" />
                      Profile
                      <span className="absolute left-0 right-0 bottom-2 mx-auto w-0 h-px bg-white transition-all duration-300 group-hover:w-4/5"></span>
                    </Link>
                  </div>

                  <div className="p-6 border-t border-white/20">
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
