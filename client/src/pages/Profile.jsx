import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function Profile() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
  });
  const [editMode, setEditMode] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch profile data on load
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setErrorMessage("Please log in first.");
      return;
    }

    fetch("http://127.0.0.1:8000/api/v1/user/profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.email) {
          setFormData({
            full_name: data.full_name || "",
            email: data.email || "",
            password: "",
          });
        } else {
          setErrorMessage(data.detail || "Failed to load profile.");
        }
      })
      .catch(() => setErrorMessage("Server error while fetching profile."));
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Save updated profile
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setErrorMessage("");

    const token = localStorage.getItem("token");

    try {
      const res = await fetch(
        "http://127.0.0.1:8000/api/v1/user/profile/update",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || "Failed to update profile");

      setMessage("Profile updated successfully!");
      setEditMode(false);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
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
              My Profile
            </CardTitle>
            <CardDescription className="text-white/50 text-base">
              Manage your personal information
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

            {message && (
              <Alert className="bg-green-500/15 border-green-400/30 text-green-200 backdrop-blur-sm">
                <AlertDescription className="text-sm">
                  {message}
                </AlertDescription>
              </Alert>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label
                  htmlFor="full_name"
                  className="text-white/70 text-sm font-medium"
                >
                  Full Name
                </Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  disabled={!editMode}
                  className="h-12 bg-white/8 border-white/15 text-white placeholder:text-white/35 focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all duration-300"
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-white/70 text-sm font-medium"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!editMode}
                  className="h-12 bg-white/8 border-white/15 text-white placeholder:text-white/35 focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all duration-300"
                  placeholder="Enter your email"
                />
              </div>

              {editMode && (
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-white/70 text-sm font-medium"
                  >
                    Change Password
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="h-12 bg-white/8 border-white/15 text-white placeholder:text-white/35 focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all duration-300"
                    placeholder="Enter new password"
                  />
                </div>
              )}

              <div className="flex justify-between pt-6">
                {!editMode ? (
                  <Button
                    type="button"
                    className="w-full h-12 cursor-pointer bg-white hover:bg-white/90 text-gray-900 font-medium transition-all duration-300 shadow-lg hover:shadow-white/10"
                    onClick={() => setEditMode(true)}
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-[48%] h-12 cursor-pointer bg-white hover:bg-white/90 text-gray-900 font-medium transition-all duration-300 shadow-lg hover:shadow-white/10"
                    >
                      {loading ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setEditMode(false)}
                      className="w-[48%] h-12 cursor-pointer bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium transition-all duration-300 shadow-lg hover:shadow-white/10"
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
