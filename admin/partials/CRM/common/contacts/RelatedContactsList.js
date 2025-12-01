"use client";
import { useEffect, useMemo, useState } from "react";

import { DataTable } from "@/components/DataTable2";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

import Columns from "./Columns";
import CardActions from "./CardActions";
import Pagination from "@/components/Pagination";
import RecordNotFound from "@/components/RecordNotFound";
import LoadingSkeletonTable from "@/components/LoadingSkeletonTable";

import { useSegment } from "@/helper/GeneralFunctions";
import useContactsStore, {
  useContactsAssociationStore,
} from "@/stores/crm/useContactsStore";

export default function RelatedContactsList() {
  const source_module = useSegment(1);
  const source_module_id = useSegment(3);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const records = useContactsAssociationStore((s) => s.records);
  const loading = useContactsAssociationStore((s) => s.loading);
  const fetchRecords = useContactsAssociationStore((s) => s.fetchRecords);

  // ✅ FETCH DATA - starting
  useEffect(() => {
    if (source_module && source_module_id) {
      fetchRecords({
        source_module,
        source_module_id,
        target_module: "contacts",
      });
    }
  }, [fetchRecords, source_module, source_module_id]);
  // ✅ FETCH DATA - ending

  // FOR PAGINATION - Starting
  const totalPages = records?.length
    ? Math.ceil(records.length / itemsPerPage)
    : 1;
  const currentData = records.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };
  const columns = useMemo(() => Columns({ currentPage, itemsPerPage }), [currentPage]);
  // FOR PAGINATION - Ending

  return (
    <Card className="gap-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-gray-900">Contacts</h2>
          <CardActions />
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <LoadingSkeletonTable qty={3} />
        ) : records?.length ? (
          <>
            <DataTable
              columns={columns}
              data={currentData}
              useStore={useContactsStore}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        ) : (
          <RecordNotFound />
        )}
      </CardContent>
    </Card>
  );
}
