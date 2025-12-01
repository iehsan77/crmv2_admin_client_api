"use client";
import React, { useState, useEffect, useMemo } from "react";

import Pagination from "@/components/Pagination";
import FeaturesListCard from "@/partials/rentify/features/FeaturesListCard";
import { Search } from "lucide-react";

const Page = ({ loading, data = [], page = 1 }) => {
  const [currentPage, setCurrentPage] = useState(page);
  const [searchTerm, setSearchTerm] = useState(""); // 🔹 search state

  const itemsPerPage = 10;

  // 🔹 Filtered data based on searchTerm
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const lower = searchTerm.toLowerCase();
    return data.filter(
      (item) =>
        item?.title?.toLowerCase().includes(lower) ||
        item?.title_ar?.toLowerCase().includes(lower)
    );
  }, [data, searchTerm]);

  useEffect(() => {
    if (currentPage > Math.ceil(filteredData.length / itemsPerPage)) {
      setCurrentPage(1);
    }
  }, [filteredData, itemsPerPage, currentPage]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredData.length / itemsPerPage)),
    [filteredData.length, itemsPerPage]
  );

  const currentFeatures = useMemo(
    () =>
      filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      ),
    [filteredData, currentPage, itemsPerPage]
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="space-y-4">
      {/* 🔹 Search Bar */}
      <div className="inline-flex items-center justify-start border-b">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // reset to page 1 when searching
          }}
          className="px-3 py-2 outline-none text-sm"
        />
        <Search className="w-4 text-muted-foreground me-3" />
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground">Loading...</p>
      ) : currentFeatures.length === 0 ? (
        <p className="text-center text-muted-foreground">No features found.</p>
      ) : (
        <div className="space-y-2">
          {currentFeatures.map((feature) => (
            <FeaturesListCard key={feature?.id} record={feature} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default Page;

// "use client";
// import React, { useState, useEffect, useMemo } from "react";

// import Pagination from "@/components/Pagination";
// import FeaturesListCard from "@/partials/rentify/features/FeaturesListCard";

// const Page = ({ loading, data = [], page = 1 }) => {
//   const [currentPage, setCurrentPage] = useState(page);

//   const itemsPerPage = 10;

//   useEffect(() => {
//     if (currentPage > Math.ceil(data.length / itemsPerPage)) {
//       setCurrentPage(1);
//     }
//   }, [data, itemsPerPage, currentPage]);

//   const totalPages = useMemo(
//     () => Math.max(1, Math.ceil(data.length / itemsPerPage)),
//     [data.length, itemsPerPage]
//   );

//   const currentFeatures = useMemo(
//     () =>
//       data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
//     [data, currentPage, itemsPerPage]
//   );

//   const handlePageChange = (page) => {
//     if (page >= 1 && page <= totalPages) {
//       setCurrentPage(page);
//     }
//   };

//   return (
//     <div className="space-y-4">

//       {loading ? (
//         <p className="text-center text-muted-foreground">Loading...</p>
//       ) : currentFeatures.length === 0 ? (
//         <p className="text-center text-muted-foreground">No features found.</p>
//       ) : (
//         <div className="space-y-2">
//           {currentFeatures.map((feature) => (
//             <FeaturesListCard key={feature?.id} record={feature} />
//           ))}
//         </div>
//       )}

//       {totalPages > 1 && (
//         <Pagination
//           currentPage={currentPage}
//           totalPages={totalPages}
//           onPageChange={handlePageChange}
//         />
//       )}
//     </div>
//   );
// };

// export default Page;
