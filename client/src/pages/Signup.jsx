import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("candidate");
  const [companyName, setCompanyName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password || !confirmPassword) {
      setErrorMessage("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    if (role === "recruiter" && !companyName) {
      setErrorMessage("Company name is required for recruiters.");
      return;
    }

    setErrorMessage("");
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          username: email,
          email,
          password,
          role,
          company_name: role === "recruiter" ? companyName : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Signup failed");
      }

      setLoading(false);
      navigate("/login");
      
    } catch (error) {
      setErrorMessage(error.message);
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-8 pt-20"
      style={{ backgroundColor: "rgb(34, 24, 36)" }}
    >
      <div className="w-full max-w-md">
        <div className="absolute inset-0 bg-white/5 rounded-2xl blur-3xl"></div>

        <Card className="relative bg-black/50 border-white/15 backdrop-blur-2xl shadow-2xl">
          <CardHeader className="space-y-3 text-center pb-8">
            <CardTitle className="text-2xl font-medium text-white tracking-tight">
              Create your account
            </CardTitle>
            <CardDescription className="text-white/50 text-base">
              Get started with your free account
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {errorMessage && (
              <Alert className="bg-red-500/15 border-red-400/30 text-red-200 backdrop-blur-sm">
                <AlertDescription className="text-sm">
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Role Selection */}
              <div className="space-y-3">
                <Label className="text-white/70 text-sm font-medium">
                  I am a:
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("candidate")}
                    className={`p-3 rounded-lg border transition-all ${
                      role === "candidate"
                        ? "bg-white/20 border-white/40 text-white"
                        : "bg-white/5 border-white/15 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    Candidate
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("recruiter")}
                    className={`p-3 rounded-lg border transition-all ${
                      role === "recruiter"
                        ? "bg-white/20 border-white/40 text-white"
                        : "bg-white/5 border-white/15 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    Recruiter
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="full_name"
                  className="text-white/70 text-sm font-medium"
                >
                  Full Name
                </Label>
                <Input
                  id="full_name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-12 bg-white/8 border-white/15 text-white placeholder:text-white/35 focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all duration-300"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              {role === "recruiter" && (
                <div className="space-y-2">
                  <Label
                    htmlFor="company"
                    className="text-white/70 text-sm font-medium"
                  >
                    Company Name
                  </Label>
                  <Input
                    id="company"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="h-12 bg-white/8 border-white/15 text-white placeholder:text-white/35 focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all duration-300"
                    placeholder="Enter your company name"
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-white/70 text-sm font-medium"
                >
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                  className="h-12 bg-white/8 border-white/15 text-white placeholder:text-white/35 focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all duration-300"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-white/70 text-sm font-medium"
                >
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value.trim())}
                  className="h-12 bg-white/8 border-white/15 text-white placeholder:text-white/35 focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all duration-300"
                  placeholder="Create a password"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-white/70 text-sm font-medium"
                >
                  Confirm password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value.trim())}
                  className="h-12 bg-white/8 border-white/15 text-white placeholder:text-white/35 focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all duration-300"
                  placeholder="Confirm your password"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 cursor-pointer bg-white hover:bg-white/90 text-gray-900 font-medium transition-all duration-300 mt-8 shadow-lg hover:shadow-white/10"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-900 rounded-full animate-spin"></div>
                    <span>Creating account...</span>
                  </div>
                ) : (
                  "Create account"
                )}
              </Button>
            </form>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-black/50 px-4 text-white/40">
                  Already have an account?
                </span>
              </div>
            </div>

            <div className="text-center">
              <Link
                to="/login"
                className="text-white/60 hover:text-white text-sm font-medium transition-colors duration-300 hover:underline underline-offset-4"
              >
                Sign in instead
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
