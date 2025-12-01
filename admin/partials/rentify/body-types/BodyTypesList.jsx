"use client";
import React, { useState, useEffect, useMemo } from "react";

import Pagination from "@/components/Pagination";
import BodyTypesListCard from "@/partials/rentify/body-types/BodyTypesListCard";

const Page = ({ loading, data = [], page = 1 }) => {
  const [currentPage, setCurrentPage] = useState(page);

  const itemsPerPage = 10;

  useEffect(() => {
    if (currentPage > Math.ceil(data.length / itemsPerPage)) {
      setCurrentPage(1);
    }
  }, [data, itemsPerPage, currentPage]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(data.length / itemsPerPage)),
    [data.length, itemsPerPage]
  );

  const currentBodyTypes = useMemo(
    () =>
      data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [data, currentPage, itemsPerPage]
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  

  console.log("currentBodyTypes 36")
  console.log(currentBodyTypes)


  return (
    <div className="space-y-4">
      {loading ? (
        <p className="text-center text-muted-foreground">Loading...</p>
      ) : currentBodyTypes.length === 0 ? (
        <p className="text-center text-muted-foreground">No bodyTypes found.</p>
      ) : (
        <div className="space-y-2">
          {currentBodyTypes.map((bodyType) => (
            <BodyTypesListCard key={bodyType?.id} record={bodyType} />
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