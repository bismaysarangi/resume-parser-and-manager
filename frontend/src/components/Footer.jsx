import React from "react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-400 p-4 mt-auto">
      <div className="container mx-auto text-center text-sm">
        &copy; {new Date().getFullYear()} ResumeParser. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
