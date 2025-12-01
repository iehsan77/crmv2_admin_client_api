"use client";
import React, { useState, useEffect, useMemo } from "react";

import VariantsFilters from "@/partials/rentify/variants/VariantsFilters";

import Pagination from "@/components/Pagination";
import VariantsListCard from "@/partials/rentify/variants/VariantsListCard";

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

  const currentVariants = useMemo(
    () =>
      data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [data, currentPage, itemsPerPage]
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="space-y-4">
      <VariantsFilters variants={data} />

      {loading ? (
        <p className="text-center text-muted-foreground">Loading...</p>
      ) : currentVariants.length === 0 ? (
        <p className="text-center text-muted-foreground">No variants found.</p>
      ) : (
        <div className="space-y-2">
          {currentVariants.map((variant) => (
            <VariantsListCard key={variant?.id} record={variant} />
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
