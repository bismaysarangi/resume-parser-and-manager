import { Link } from "react-router-dom";
import { FaGithub, FaLinkedin } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-[rgb(45,32,54)] text-gray-300 py-8 mt-10 border-t border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Branding and Description */}
        <div className="flex flex-col md:flex-row justify-between items-center border-b border-white/20 pb-6 mb-6">
          <div className="text-center md:text-left mb-4 md:mb-0">
            <h2 className="text-2xl font-bold text-white">
              Resume Parser
            </h2>
            <p className="text-sm text-gray-400 max-w-md">
              AI-powered resume parsing and management system helping professionals streamline their career growth.
            </p>
          </div>

          {/* Social Media */}
          <div className="flex space-x-4">
            <a
              href="https://github.com/your-github-profile"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition"
              aria-label="GitHub"
            >
              <FaGithub size={24} />
            </a>
            <a
              href="https://linkedin.com/in/your-linkedin-profile"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition"
              aria-label="LinkedIn"
            >
              <FaLinkedin size={24} />
            </a>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm text-gray-400">
          <div>
            <h3 className="font-semibold text-white mb-3">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="hover:text-white transition">Home</Link>
              </li>
              <li>
                <Link to="/parser" className="hover:text-white transition">Parser</Link>
              </li>
              <li>
                <Link to="/upload" className="hover:text-white transition">Upload</Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-white transition">Profile</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-3">Account</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/login" className="hover:text-white transition">Login</Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-white transition">Sign Up</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-3">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="hover:text-white transition">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition">Terms of Service</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-3">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://github.com/your-github-profile"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://linkedin.com/in/your-linkedin-profile"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition"
                >
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-gray-400 text-sm mt-6">
          © {new Date().getFullYear()} Resume Parser. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
