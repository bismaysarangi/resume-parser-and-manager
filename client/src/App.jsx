import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

// Shared Pages
import Home from "./pages/Home";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// Candidate Pages
import Upload from "./pages/candidate/Upload";
import ParsedResults from "./pages/candidate/ParsedResults";
import History from "./pages/candidate/History";
import AiInsights from "./pages/candidate/AiInsights";
import Dashboard from "./pages/candidate/Dashboard";
import Profile from "./pages/candidate/Profile";

// Recruiter Pages
import RecruiterProfile from "./pages/recruiter/RecruiterProfile";

// Protected Route Component
function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ backgroundColor: "rgb(34, 24, 36)" }}
      >
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return (
      <Navigate
        to={user.role === "recruiter" ? "/recruiter/dashboard" : "/dashboard"}
      />
    );
  }

  return children;
}

function App() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Candidate Routes */}
        <Route
          path="/candidate/dashboard"
          element={
            <ProtectedRoute requiredRole="candidate">
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/upload"
          element={
            <ProtectedRoute requiredRole="candidate">
              <Upload />
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/parsed-results"
          element={
            <ProtectedRoute requiredRole="candidate">
              <ParsedResults />
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/history"
          element={
            <ProtectedRoute requiredRole="candidate">
              <History />
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/ai-insights"
          element={
            <ProtectedRoute requiredRole="candidate">
              <AiInsights />
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/profile"
          element={
            <ProtectedRoute requiredRole="candidate">
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Recruiter Routes */}
        <Route
          path="/recruiter/profile"
          element={
            <ProtectedRoute requiredRole="recruiter">
              <RecruiterProfile />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
