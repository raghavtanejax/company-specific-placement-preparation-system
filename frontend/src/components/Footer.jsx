import React from 'react';

const Footer = () => {
  return (
    <footer className="w-full bg-white border-t border-gray-200 mt-auto shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Left Side: Made By */}
          <div className="text-gray-600 font-medium text-sm sm:text-base flex items-center gap-1.5 transition-all duration-300 hover:scale-105 origin-left">
            <span>Made by</span>
            <a 
              href="https://raghavtaneja.in" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 relative group font-bold tracking-wide"
            >
              raghavtaneja.in
              {/* Interactive underline effect */}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
            </a>
          </div>

          {/* Right Side: Feedback / Email */}
          <div className="text-gray-600 text-sm sm:text-base flex flex-wrap items-center justify-center md:justify-end gap-2">
            <span className="flex items-center gap-1.5">
              {/* Interactive lightbulb */}
              <span className="text-xl inline-block hover:rotate-12 hover:scale-110 transition-transform duration-300 cursor-default">
                💡
              </span> 
              <span>Have a feature idea or facing an issue? Mail at:</span>
            </span>
            <a 
              href="mailto:raghavtaneja487@gmail.com"
              className="font-semibold text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 flex items-center gap-2"
            >
              {/* Optional tiny mail icon for extra flair */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              raghavtaneja487@gmail.com
            </a>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
