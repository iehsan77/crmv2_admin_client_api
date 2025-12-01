// import React from "react";

// const Loader = () => {
//   return <div className="text-center">Loading...</div>;
// };

import React from "react";

const Loader = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* Main spinner */}
      <div className="relative h-16 w-16">
        {/* Outer ring */}
        <div className="absolute h-full w-full animate-spin rounded-full border-4 border-t-transparent border-[#7cdae4]/40"></div>

        {/* Inner ring */}
        {/* <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-4 border-b-transparent border-primary/75"></div> */}

        {/* Center dot */}
        <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7cdae4]"></div>
      </div>

      {/* Optional loading text with animation */}
      <div className="flex space-x-1">
        <span className="animate-bounce">L</span>
        <span className="animate-bounce delay-75">O</span>
        <span className="animate-bounce delay-100">A</span>
        <span className="animate-bounce delay-150">D</span>
        <span className="animate-bounce delay-200">I</span>
        <span className="animate-bounce delay-300">N</span>
        <span className="animate-bounce delay-500">G</span>
      </div>
    </div>
  );
};

export default Loader;
