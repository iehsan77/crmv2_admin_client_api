"use client";

import { useState } from "react";

import DataTable from "react-data-table-component";

import { ProfilesUserListColumns } from "@/partials/settings/security/profiles/ProfilesUserListColumns";

import useSettingsStore from "@/stores/useSettingsStore";

export default function ProfileUsers({ record = [] }) {
  const [page, setPage] = useState(1);
  const { rpp } = useSettingsStore();

  const columns = ProfilesUserListColumns({
    page,
    rpp,
  });

  return (
    <div>
      <DataTable
        title=""
        columns={columns}
        data={record?.users}
        pagination
        persistTableHead
        paginationPerPage={rpp}
        onChangePage={(page) => setPage(page)}
      />
    </div>
  );
}
