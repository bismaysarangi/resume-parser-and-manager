import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Navbar from "./components/Navbar";
import Parser from "./pages/Parser";
import Footer from "./components/Footer";
import Upload from "./pages/Upload";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/parser" element={<Parser />} />
        <Route path="/upload" element={<Upload />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
