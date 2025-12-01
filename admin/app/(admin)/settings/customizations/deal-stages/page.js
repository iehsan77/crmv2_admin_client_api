"use client";

import { useEffect, useState } from "react";

import DataTable from "react-data-table-component";

import { PageSubTitle } from "@/components/PageTitle";
import { StagesForm } from "@/partials/settings/customizations/deals/StagesForm";
import { StagesListColumns } from "@/partials/settings/customizations/deals/StagesListColumns";

import useSettingsStore from "@/stores/useSettingsStore";
import useStagesStore from "@/stores/settings/useStagesStore";
import useToggleStore from "@/stores/useToggleStore";

import LoadingSkeletonTable from "@/components/LoadingSkeletonTable";

export default function Page() {
  const title = "Deal Stages";
  const [page, setPage] = useState(1);
  const { rpp } = useSettingsStore();

  const [loading, setLoading] = useState(true);

  const {
    stages,
    fetchStages,
    setSelectedStage,
    deleteStage,
    restoreStage,
  } = useStagesStore();
  const { open, setOnConfirm, setMessage } = useToggleStore();

  useEffect(() => {
    const fetchData = async () => {
      await fetchStages();
      setLoading(false);
    };
    fetchData();
  }, [fetchStages]);

  const handleDelete = (record) => {
    setMessage(
      "Are you sure you want to delete '" + record?.title + "' stage?"
    );
    setOnConfirm(() => deleteStage(record?.id));
    open();
  };
  const handleRestore = (record) => {
    setMessage(
      "Are you sure you want to restore '" + record?.title + "' stages?"
    );
    setOnConfirm(() => restoreStage(record?.id));
    open();
  };
  const handleEditRecord = (record) => {
    setSelectedStage(record);
  };
  const columns = StagesListColumns({
    page,
    rpp,
    onEdit: handleEditRecord,
    onDelete: handleDelete,
    onRestore: handleRestore,
  });

  return (
    <>
      <PageSubTitle title={title}>
        <StagesForm title={title} />
      </PageSubTitle>
      <div className="page">
        {loading ? (
          <LoadingSkeletonTable />
        ) : (
          <DataTable
            title=""
            columns={columns}
            data={stages}
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
