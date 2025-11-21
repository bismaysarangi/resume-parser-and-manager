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
import {
  User,
  Mail,
  Lock,
  Edit2,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Building2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function RecruiterProfile() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [formData, setFormData] = useState({
    full_name: "",
    company_name: "",
    email: "",
    password: "",
  });
  const [originalData, setOriginalData] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [showBackButton, setShowBackButton] = useState(false);

  // Fetch profile data on load
  useEffect(() => {
    if (!token) {
      setErrorMessage("Please log in first.");
      setFetchingProfile(false);
      return;
    }

    fetch("http://127.0.0.1:8000/api/v1/user/profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.email) {
          const profileData = {
            full_name: data.full_name || "",
            company_name: data.company_name || "",
            email: data.email || "",
            password: "",
          };
          setFormData(profileData);
          setOriginalData({
            full_name: data.full_name || "",
            company_name: data.company_name || "",
            email: data.email || "",
          });
        } else {
          setErrorMessage(data.detail || "Failed to load profile.");
        }
      })
      .catch(() => setErrorMessage("Server error while fetching profile."))
      .finally(() => setFetchingProfile(false));
  }, [token]);

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage("");
    setErrorMessage("");
  };

  // Cancel edit mode
  const handleCancel = () => {
    setFormData({
      ...originalData,
      password: "",
    });
    setEditMode(false);
    setMessage("");
    setErrorMessage("");
  };

  // Save updated profile
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setErrorMessage("");

    // Prepare update data - only include changed fields
    const updateData = {};
    if (formData.full_name !== originalData.full_name) {
      updateData.full_name = formData.full_name;
    }
    if (formData.company_name !== originalData.company_name) {
      updateData.company_name = formData.company_name;
    }
    if (formData.email !== originalData.email) {
      updateData.email = formData.email;
    }
    if (formData.password) {
      updateData.password = formData.password;
    }

    if (Object.keys(updateData).length === 0) {
      setErrorMessage("No changes detected.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        "http://127.0.0.1:8000/api/v1/user/profile/update",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || "Failed to update profile");

      // If email was updated, a new token will be provided
      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
      }

      setMessage("Profile updated successfully!");
      setOriginalData({
        full_name: data.user?.full_name || formData.full_name,
        company_name: data.user?.company_name || formData.company_name,
        email: data.user?.email || formData.email,
      });
      setFormData({
        full_name: data.user?.full_name || formData.full_name,
        company_name: data.user?.company_name || formData.company_name,
        email: data.user?.email || formData.email,
        password: "",
      });
      setEditMode(false);
      setShowBackButton(true);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingProfile) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "rgb(34, 24, 36)" }}
      >
        <div className="text-white text-lg">Loading profile...</div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 pt-20"
      style={{ backgroundColor: "rgb(34, 24, 36)" }}
    >
      <div className="w-full max-w-2xl">
        {/* Glassmorphic background blur effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10 rounded-3xl blur-3xl"></div>

        <Card className="relative bg-black/40 border-white/20 backdrop-blur-2xl shadow-2xl overflow-hidden">
          {/* Decorative gradient overlay */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/5 to-transparent"></div>

          <CardHeader className="space-y-4 text-center pb-8 pt-10 relative">
            {/* Profile Avatar with Back Button */}
            <div className="flex justify-center items-center mb-4 gap-4">
              {/* Back Button - appears after update */}
              {showBackButton && (
                <Button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="h-12 w-12 cursor-pointer bg-white/10 hover:bg-white/20 text-white border border-white/30 font-medium transition-all duration-300 shadow-lg hover:shadow-white/10 hover:scale-[1.02] active:scale-[0.98] p-0"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              )}

              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-blue-400/30 flex items-center justify-center backdrop-blur-sm">
                <Building2 className="w-12 h-12 text-blue-300" />
              </div>
            </div>

            <CardTitle className="text-3xl font-semibold text-white tracking-tight">
              {editMode ? "Edit Profile" : "Recruiter Profile"}
            </CardTitle>
            <CardDescription className="text-white/60 text-base">
              {editMode
                ? "Update your company information"
                : "Manage your recruiter account settings"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 px-8 pb-8">
            {/* Success Message */}
            {message && (
              <Alert className="bg-green-500/20 border-green-400/40 text-green-200 backdrop-blur-sm">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="text-sm font-medium ml-2">
                  {message}
                </AlertDescription>
              </Alert>
            )}

            {/* Error Message */}
            {errorMessage && (
              <Alert className="bg-red-500/20 border-red-400/40 text-red-200 backdrop-blur-sm">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm font-medium ml-2">
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-6">
              {/* Full Name Field */}
              <div className="space-y-3">
                <Label
                  htmlFor="full_name"
                  className="text-white/80 text-sm font-medium flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Full Name
                </Label>
                <div className="relative">
                  <Input
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    disabled={!editMode}
                    className="h-14 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed pl-4 text-base"
                    placeholder="Enter your full name"
                  />
                  {!editMode && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Lock className="w-4 h-4 text-white/30" />
                    </div>
                  )}
                </div>
              </div>

              {/* Company Name Field */}
              <div className="space-y-3">
                <Label
                  htmlFor="company_name"
                  className="text-white/80 text-sm font-medium flex items-center gap-2"
                >
                  <Building2 className="w-4 h-4" />
                  Company Name
                </Label>
                <div className="relative">
                  <Input
                    id="company_name"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    disabled={!editMode}
                    className="h-14 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed pl-4 text-base"
                    placeholder="Enter your company name"
                  />
                  {!editMode && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Lock className="w-4 h-4 text-white/30" />
                    </div>
                  )}
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-3">
                <Label
                  htmlFor="email"
                  className="text-white/80 text-sm font-medium flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Email Address
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!editMode}
                    className="h-14 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed pl-4 text-base"
                    placeholder="Enter your email"
                  />
                  {!editMode && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Lock className="w-4 h-4 text-white/30" />
                    </div>
                  )}
                </div>
              </div>

              {/* Password Field (only in edit mode) */}
              {editMode && (
                <div className="space-y-3">
                  <Label
                    htmlFor="password"
                    className="text-white/80 text-sm font-medium flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    New Password
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="h-14 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-300 pl-4 text-base"
                    placeholder="Leave blank to keep current password"
                  />
                  <p className="text-white/50 text-xs mt-2">
                    Leave this field empty if you don't want to change your
                    password
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6">
                {!editMode ? (
                  <Button
                    type="button"
                    className="w-full h-14 cursor-pointer bg-white hover:bg-white/90 text-gray-900 font-semibold transition-all duration-300 shadow-lg hover:shadow-white/20 hover:scale-[1.02] active:scale-[0.98] text-base"
                    onClick={() => setEditMode(true)}
                  >
                    <Edit2 className="w-5 h-5 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex-1 h-14 cursor-pointer bg-white hover:bg-white/90 text-gray-900 font-semibold transition-all duration-300 shadow-lg hover:shadow-white/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-base"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleCancel}
                      disabled={loading}
                      className="flex-1 h-14 cursor-pointer bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold transition-all duration-300 shadow-lg hover:shadow-white/10 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-base"
                    >
                      <X className="w-5 h-5 mr-2" />
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Info Card */}
            {!editMode && (
              <div className="mt-8 p-4 bg-blue-500/10 border border-blue-400/20 rounded-xl backdrop-blur-sm">
                <p className="text-blue-200 text-sm text-center">
                  Keep your company information up to date to help candidates
                  find you
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
