"use client";

import { useEffect, useState } from "react";

import DataTable from "react-data-table-component";

import { PageSubTitle } from "@/components/PageTitle";
import { SystemUsersForm } from "@/partials/settings/general/systemUsers/SystemUsersForm";
import { SystemUsersListColumns } from "@/partials/settings/general/systemUsers/SystemUsersListColumns";

import useSettingsStore from "@/stores/useSettingsStore";
import useSystemUsersStore from "@/stores/settings/useSystemUsersStore";
import useToggleStore from "@/stores/useToggleStore";

import LoadingSkeletonTable from "@/components/LoadingSkeletonTable";

export default function Page() {
  const title = "System Users";
  const [page, setPage] = useState(1);
  const { rpp } = useSettingsStore();

  const [loading, setLoading] = useState(true);

  const {
    systemUsers,
    fetchSystemUsers,
    setSelectedSystemUser,
    deleteSystemUser,
    restoreSystemUser,
  } = useSystemUsersStore();
  const { open, setOnConfirm, setMessage } = useToggleStore();

  useEffect(() => {
    const fetchData = async () => {
      await fetchSystemUsers();
      setLoading(false);
    };
    fetchData();
  }, [fetchSystemUsers]);

  const handleDelete = (record) => {
    setMessage(
      "Are you sure you want to delete '" + record?.title + "' system user?"
    );
    setOnConfirm(() => deleteSystemUser(record?.id));
    open();
  };
  const handleRestore = (record) => {
    setMessage(
      "Are you sure you want to restore '" + record?.title + "' system user?"
    );
    setOnConfirm(() => restoreSystemUser(record?.id));
    open();
  };
  const handleEditRecord = (record) => {
    setSelectedSystemUser(record);
  };
  const columns = SystemUsersListColumns({
    page,
    rpp,
    onEdit: handleEditRecord,
    onDelete: handleDelete,
    onRestore: handleRestore,
  });

  return (
    <>
      <PageSubTitle title={title}>
        <SystemUsersForm title={title} />
      </PageSubTitle>
      <div className="page">
        {loading ? (
          <LoadingSkeletonTable />
        ) : (
          <DataTable
            title=""
            columns={columns}
            data={systemUsers}
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
