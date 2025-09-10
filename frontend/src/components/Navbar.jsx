import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-gray-900 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-xl font-bold">
          <Link to="/">ResumeParser</Link>
        </div>
        <div className="flex space-x-4">
          <Link to="/parser" className="hover:text-gray-400">
            Parser
          </Link>
          <Link to="/upload" className="hover:text-gray-400">
            Upload
          </Link>
          <Link to="/login" className="hover:text-gray-400">
            Login
          </Link>
          <Link to="/signup" className="hover:text-gray-400">
            Sign Up
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;