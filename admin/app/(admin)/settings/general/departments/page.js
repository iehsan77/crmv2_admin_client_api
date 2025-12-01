"use client";

import { useEffect, useState } from "react";

import DataTable from "react-data-table-component";

import { PageSubTitle } from "@/components/PageTitle";
import { DepartmentsForm } from "@/partials/settings/general/departments/DepartmentsForm";
import { DepartmentsListColumns } from "@/partials/settings/general/departments/DepartmentsListColumns";

import useSettingsStore from "@/stores/useSettingsStore";
import useDepartmentsStore from "@/stores/settings/useDepartmentsStore";
import useToggleStore from "@/stores/useToggleStore";

import LoadingSkeletonTable from "@/components/LoadingSkeletonTable";

export default function Page() {
  const title = "Departments";
  const [page, setPage] = useState(1);
  const { rpp } = useSettingsStore();

  const [loading, setLoading] = useState(true);

  const {
    departments,
    fetchDepartments,
    setSelectedDepartment,
    deleteDepartment,
    restoreDepartment,
  } = useDepartmentsStore();
  const { open, setOnConfirm, setMessage } = useToggleStore();

  useEffect(() => {
    const fetchData = async () => {
      await fetchDepartments();
      setLoading(false);
    };
    fetchData();
  }, [fetchDepartments]);

  const handleDelete = (record) => {
    setMessage(
      "Are you sure you want to delete '" + record?.title + "' department?"
    );
    setOnConfirm(() => deleteDepartment(record?.id));
    open();
  };
  const handleRestore = (record) => {
    setMessage(
      "Are you sure you want to restore '" + record?.title + "' department?"
    );
    setOnConfirm(() => restoreDepartment(record?.id));
    open();
  };
  const handleEditRecord = (record) => {
    setSelectedDepartment(record);
  };
  const columns = DepartmentsListColumns({
    page,
    rpp,
    onEdit: handleEditRecord,
    onDelete: handleDelete,
    onRestore: handleRestore,
  });

  return (
    <>
      <PageSubTitle title={title}>
        <DepartmentsForm title={title} />
      </PageSubTitle>
      <div className="page">
        {loading ? (
          <LoadingSkeletonTable />
        ) : (
          <DataTable
            title=""
            columns={columns}
            data={departments}
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
