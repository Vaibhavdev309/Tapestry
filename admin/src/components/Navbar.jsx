import React from "react";
import { assets } from "../assets/assets";

const Navbar = ({ setToken, toggleSidebar, isMobile }) => {
  return (
    <div className="flex items-center justify-between bg-white shadow-sm py-3 px-4 lg:px-6">
      <div className="flex items-center gap-4">
        {isMobile && (
          <button
            onClick={toggleSidebar}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        )}
        <img className="w-[120px] max-w-[140px]" src={assets.logo} alt="Logo" />
      </div>

      <button
        onClick={() => setToken("")}
        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-full text-sm lg:text-base transition-colors"
      >
        Logout
      </button>
    </div>
  );
};

export default Navbar;
