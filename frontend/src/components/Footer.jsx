import { Link } from "react-router-dom";
import { FaEnvelope, FaGithub, FaLinkedin, FaInstagram } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-[rgb(45,32,54)] text-gray-300 py-10 border-t border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Branding Section */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-3">Resume Parser</h2>
            <p className="text-sm text-gray-400 max-w-sm">
              AI-powered resume parsing and management system helping professionals streamline their career growth and job search.
            </p>
            <div className="flex space-x-4 mt-4">
              <a href="mailto:support@resumeparser.com" className="text-gray-400 hover:text-white transition" aria-label="Email">
                <FaEnvelope size={20} />
              </a>
              <a href="https://github.com/your-github-profile" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition" aria-label="GitHub">
                <FaGithub size={20} />
              </a>
              <a href="https://linkedin.com/in/your-linkedin-profile" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition" aria-label="LinkedIn">
                <FaLinkedin size={20} />
              </a>
              <a href="https://instagram.com/your-instagram-profile" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition" aria-label="Instagram">
                <FaInstagram size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links Section */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link to="/" className="hover:text-white transition">Home</Link>
              </li>
              <li>
                <Link to="/parser" className="hover:text-white transition">Resume Parser</Link>
              </li>
              <li>
                <Link to="/upload" className="hover:text-white transition">Upload Resume</Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-white transition">Profile</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition">About Us</Link>
              </li>
            </ul>
          </div>

          {/* Stay Updated Section */}
          <div>
            <h3 className="text-white font-semibold mb-4">Stay Updated</h3>
            <p className="text-sm text-gray-400 mb-4">
              Get the latest parsing features and career insights delivered to your inbox.
            </p>
            <form className="flex space-x-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-3 py-2 rounded-md bg-[rgb(45,32,54)] border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-md hover:opacity-90 transition"
              >
                Subscribe
              </button>
            </form>
            <p className="text-xs text-gray-500 mt-2">No spam. Unsubscribe anytime.</p>
          </div>

        </div>

        <div className="text-center text-gray-500 text-xs mt-10">
          © {new Date().getFullYear()} Resume Parser. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
