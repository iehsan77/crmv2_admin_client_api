"use client";

import { useState } from "react";

const Tabs = ({ tabs }) => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="w-full">
      {/* Tab Buttons */}
      <div className="flex border-b border-gray-300">
        {tabs.map((tab, index) => (
          <button
          type="button"
            key={index}
            className={`px-4 py-2 text-sm font-medium focus:outline-none transition-all
              ${activeTab === index
                ? "border-b-2 border-blue-500 text-[#1E3A8A]"
                : "text-gray-600 hover:text-blue-500"
              }`}
            onClick={() => setActiveTab(index)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-4 p-4 bg-white">
        {tabs.map((tab, index) => (
          <div key={index} className={activeTab === index ? "block" : "hidden"}>
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tabs;
