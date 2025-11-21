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

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Please fill in both fields.");
      return;
    }
    setErrorMessage("");
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const res = await fetch("http://127.0.0.1:8000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Login failed");
      }

      // Create user object with role
      const user = {
        username: data.username,
        role: data.role,
      };

      // Use login from useAuth hook
      login(data.access_token, user);

      setLoading(false);

      // Redirect based on role
      if (data.role === "recruiter") {
        navigate("/recruiter/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      setErrorMessage(error.message);
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "rgb(34, 24, 36)" }}
    >
      <div className="w-full max-w-md">
        <div className="absolute inset-0 bg-white/5 rounded-2xl blur-3xl"></div>

        <Card className="relative bg-black/50 border-white/15 backdrop-blur-2xl shadow-2xl">
          <CardHeader className="space-y-3 text-center pb-8">
            <CardTitle className="text-2xl font-medium text-white tracking-tight">
              Welcome back
            </CardTitle>
            <CardDescription className="text-white/50 text-base">
              Sign in to continue to your account
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
                  className="h-12 bg-white/8 border-white/15 text-white placeholder:text-white/35 focus:border-white/30"
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-white/70">
                  Company Name
                </Label>
                <Input
                  id="companyName"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="h-12 bg-white/8 border-white/15 text-white placeholder:text-white/35 focus:border-white/30"
                  placeholder="Enter your company name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/70">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="h-12 bg-white/8 border-white/15 text-white/50 placeholder:text-white/35 focus:border-white/30 cursor-not-allowed"
                />
                <p className="text-white/50 text-sm">
                  Email cannot be changed from profile
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-white hover:bg-white/90 text-gray-900 font-medium"
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </form>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-black/50 px-4 text-white/40">
                  First time visiting us?
                </span>
              </div>
            </div>

            <div className="text-center">
              <Link
                to="/signup"
                className="text-white/60 hover:text-white text-sm font-medium transition-colors duration-300 hover:underline underline-offset-4"
              >
                Create an account
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
