"use client";

import { useEffect, useState } from "react";

import DataTable from "react-data-table-component";

import { PageSubTitle } from "@/components/PageTitle";
import { DesignationsForm } from "@/partials/settings/general/designations/DesignationsForm";
import { DesignationsListColumns } from "@/partials/settings/general/designations/DesignationsListColumns";

import useSettingsStore from "@/stores/useSettingsStore";
import useDesignationsStore from "@/stores/settings/useDesignationsStore";
import useToggleStore from "@/stores/useToggleStore";

import LoadingSkeletonTable from "@/components/LoadingSkeletonTable";

export default function Page() {
  const title = "Designations";
  const [page, setPage] = useState(1);
  const { rpp } = useSettingsStore();

  const [loading, setLoading] = useState(true);

  const {
    designations,
    fetchDesignations,
    setSelectedDesignation,
    deleteDesignation,
    restoreDesignation,
  } = useDesignationsStore();
  const { open, setOnConfirm, setMessage } = useToggleStore();

  useEffect(() => {
    const fetchData = async () => {
      await fetchDesignations();
      setLoading(false);
    };
    fetchData();
  }, [fetchDesignations]);

  const handleDelete = (record) => {
    setMessage(
      "Are you sure you want to delete '" + record?.title + "' designation?"
    );
    setOnConfirm(() => deleteDesignation(record?.id));
    open();
  };
  const handleRestore = (record) => {
    setMessage(
      "Are you sure you want to restore '" + record?.title + "' designation?"
    );
    setOnConfirm(() => restoreDesignation(record?.id));
    open();
  };
  const handleEditRecord = (record) => {
    setSelectedDesignation(record);
  };
  const columns = DesignationsListColumns({
    page,
    rpp,
    onEdit: handleEditRecord,
    onDelete: handleDelete,
    onRestore: handleRestore,
  });

  return (
    <>
      <PageSubTitle title={title}>
        <DesignationsForm title={title} />
      </PageSubTitle>
      <div className="page">
        {loading ? (
          <LoadingSkeletonTable />
        ) : (
          <DataTable
            title=""
            columns={columns}
            data={designations}
            pagination
            persistTableHead
            paginationPerPage={rpp}
            onChangePage={(page) => setPage(page)}
          />
        )}
      </div>
    </>
  );
}
