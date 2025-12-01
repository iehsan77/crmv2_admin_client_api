"use client";

import { useState, useMemo } from "react";
import { DataTable } from "@/components/DataTable";
import LoadingSkeletonTable from "@/components/LoadingSkeletonTable";
import RecordNotFound from "@/components/RecordNotFound";
import Pagination from "@/components/Pagination";
import useCommonStore from "@/stores/useCommonStore";

export default function DataDisplay({
  data = [],
  loading = false,
  columns = [],
  ListItemComponent = null,
  GridItemComponent = null,
}) {
  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20); // default inside

  const totalPages = Math.ceil(data.length / itemsPerPage) || 1;
  const { viewMode } = useCommonStore();

  // --- Paginated Data ---
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return data.slice(start, start + itemsPerPage);
  }, [data, currentPage, itemsPerPage]);

  const hasData = currentData?.length > 0;

  return (
    <div>
      <div className="space-y-4">
        {loading ? (
          <LoadingSkeletonTable />
        ) : (
          <>
            {/* --- Table View --- */}
            {viewMode === "table" &&
              (hasData ? (
                <DataTable columns={columns} data={currentData} />
              ) : (
                <RecordNotFound simple />
              ))}

            {/* --- List View --- */}
            {viewMode === "list" &&
              (hasData ? (
                ListItemComponent ? (
                  <ListItemComponent records={currentData} />
                ) : (
                  <div className="p-4 text-gray-500 border rounded">
                    ⚠️ No ListItemComponent provided
                  </div>
                )
              ) : (
                <RecordNotFound simple />
              ))}

            {/* --- Grid View --- */}
            {viewMode === "grid" &&
              (hasData ? (
                GridItemComponent ? (
                  <GridItemComponent records={currentData} />
                ) : (
                  <div className="p-4 text-gray-500 border rounded col-span-full">
                    ⚠️ No GridItemComponent provided
                  </div>
                )
              ) : (
                <RecordNotFound simple />
              ))}
          </>
        )}
      </div>

      {/* --- Pagination --- */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
