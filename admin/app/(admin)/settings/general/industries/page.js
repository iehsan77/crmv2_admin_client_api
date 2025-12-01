"use client";

import { useEffect, useState } from "react";

import DataTable from "react-data-table-component";

import { PageSubTitle } from "@/components/PageTitle";
import { IndustriesForm } from "@/partials/settings/general/industries/IndustriesForm";
import { IndustriesListColumns } from "@/partials/settings/general/industries/IndustriesListColumns";

import useSettingsStore from "@/stores/useSettingsStore";
import useIndustriesStore from "@/stores/settings/useIndustriesStore";
import useToggleStore from "@/stores/useToggleStore";

import LoadingSkeletonTable from "@/components/LoadingSkeletonTable";

export default function Page() {
  const title = "Industries";
  const [page, setPage] = useState(1);
  const { rpp } = useSettingsStore();

  const [loading, setLoading] = useState(true);

  const {
    industries,
    fetchIndustries,
    setSelectedIndustry,
    deleteIndustry,
    restoreIndustry,
  } = useIndustriesStore();
  const { open, setOnConfirm, setMessage } = useToggleStore();

  useEffect(() => {
    const fetchData = async () => {
      await fetchIndustries();
      setLoading(false);
    };
    fetchData();
  }, [fetchIndustries]);

  const handleDelete = (record) => {
    setMessage(
      "Are you sure you want to delete '" + record?.title + "' industry?"
    );
    setOnConfirm(() => deleteIndustry(record?.id));
    open();
  };
  const handleRestore = (record) => {
    setMessage(
      "Are you sure you want to restore '" + record?.title + "' industry?"
    );
    setOnConfirm(() => restoreIndustry(record?.id));
    open();
  };
  const handleEditRecord = (record) => {
    setSelectedIndustry(record);
  };
  const columns = IndustriesListColumns({
    page,
    rpp,
    onEdit: handleEditRecord,
    onDelete: handleDelete,
    onRestore: handleRestore,
  });

  return (
    <>
      <PageSubTitle title={title}>
        <IndustriesForm title={title} />
      </PageSubTitle>
      <div className="page">
        {loading ? (
          <LoadingSkeletonTable />
        ) : (
          <DataTable
            title=""
            columns={columns}
            data={industries}
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
