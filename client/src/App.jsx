import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Home from "./pages/Home";
import Navbar from "./components/Navbar";
import Parser from "./pages/ParsedResults";
import Footer from "./components/Footer";
import Upload from "./pages/Upload";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import AiInsights from "./pages/AiInsights";

function App() {
  const location = useLocation();

  useEffect(() => {
    console.log("Scrolling to top");
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/parsed-results" element={<Parser />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/ai-insights" element={<AiInsights />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
