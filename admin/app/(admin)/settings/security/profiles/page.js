"use client";

import { useEffect, useState } from "react";

import DataTable from "react-data-table-component";

import { PageSubTitle } from "@/components/PageTitle";
import { ProfilesForm } from "@/partials/settings/security/profiles/ProfilesForm";
import { ProfilesListColumns } from "@/partials/settings/security/profiles/ProfilesListColumns";

import useSettingsStore from "@/stores/useSettingsStore";
import useProfilesStore from "@/stores/settings/useProfilesStore";
import useToggleStore from "@/stores/useToggleStore";

import LoadingSkeletonTable from "@/components/LoadingSkeletonTable";

export default function Page() {
  const title = "Profiles";
  const [page, setPage] = useState(1);
  const { rpp } = useSettingsStore();

  const [loading, setLoading] = useState(true);

  const {
    profiles,
    fetchProfiles,
    setSelectedProfile,
    deleteProfile,
    restoreProfile,
  } = useProfilesStore();
  const { open, setOnConfirm, setMessage } = useToggleStore();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await fetchProfiles();
      setLoading(false);
    };

    fetchData();
  }, [fetchProfiles]);

  const handleDelete = (record) => {
    setMessage(
      "Are you sure you want to delete '" + record?.title + "' profile?"
    );
    setOnConfirm(() => deleteProfile(record?.id));
    open();
  };
  const handleRestore = (record) => {
    setMessage(
      "Are you sure you want to restore '" + record?.title + "' profile?"
    );
    setOnConfirm(() => restoreProfile(record?.id));
    open();
  };
  const handleEditRecord = (record) => {
    setSelectedProfile(record);
  };
  const columns = ProfilesListColumns({
    page,
    rpp,
    onEdit: handleEditRecord,
    onDelete: handleDelete,
    onRestore: handleRestore,
  });

  return (
    <>
      <PageSubTitle title={title}>
        <ProfilesForm title={title} />
      </PageSubTitle>
      <div className="page">
        <div className="mb-6 p-3 text-sm">
          A profile defines a set of permissions that control access to modules,
          operations, custom setup options, and various apps. It allows you to
          assign different permission sets to different users based on their
          roles or responsibilities
        </div>
        {loading ? (
          <LoadingSkeletonTable />
        ) : (
          <DataTable
            title=""
            columns={columns}
            data={profiles}
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
