
import React from 'react';
import { FileText, Menu } from 'lucide-react';

const FloatingNavbar = () => {
  return (
    <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-[80vw] max-w-6xl">
      <div className="bg-white/90 backdrop-blur-lg border border-gray-200/50 rounded-xl shadow-lg px-6 py-3">
        <div className="flex items-center justify-between w-full">
          {/* Hosho Logo */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img 
                src="/uploads/289550b2-a903-4b7c-88b3-a3c4b3f8ce49.png" 
                alt="Hosho Logo" 
                className="h-7 w-7 object-contain"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-gray-900">
               HOSHŌ DIGITAL
              </h1>
              <p className="text-sm text-gray-600 -mt-1">
                AI PDF Viewer
              </p>
            </div>
          </div>

          {/* Navigation Items - Center */}
          <div className="hidden lg:flex items-center space-x-8">
            <a 
              href="#features" 
              className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors duration-200"
            >
              Features
            </a>
            <a 
              href="#upload" 
              className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors duration-200"
            >
              Upload
            </a>
            <a 
              href="#analyze" 
              className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors duration-200"
            >
              Analyze
            </a>
          </div>

          {/* CTA Button - Right */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block">
              <button className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-lg">
                Get Started
              </button>
            </div>

            {/* Mobile Menu */}
            <div className="lg:hidden">
              <button className="p-2 text-gray-600 hover:text-red-600 transition-colors">
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
  
};

export default FloatingNavbar;
