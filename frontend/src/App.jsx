import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Navbar from "./components/Navbar";
import Parser from "./pages/Parser";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/parser" element={<Parser />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
