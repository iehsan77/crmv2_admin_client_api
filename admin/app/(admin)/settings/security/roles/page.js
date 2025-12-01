"use client";

import { useEffect, useState } from "react";

import DataTable from "react-data-table-component";

import { PageSubTitle } from "@/components/PageTitle";
import { RolesForm } from "@/partials/settings/security/roles/RolesForm";
import { RolesListColumns } from "@/partials/settings/security/roles/RolesListColumns";

import useSettingsStore from "@/stores/useSettingsStore";
import useRolesStore from "@/stores/settings/useRolesStore";
import useToggleStore from "@/stores/useToggleStore";

import RolesTreeView from "@/components/RolesTreeView";

import Loader from "@/components/Loader";

export default function Page() {
  const title = "Roles";

  const [loading, setLoading] = useState(true);

  const {
    fetchRoles,
  } = useRolesStore();

  useEffect(() => {
    async function loadRoles() {
      setLoading(true);
      await fetchRoles();
      setLoading(false);
    }
    loadRoles();
  }, [fetchRoles]);

  return (
    <>
      <PageSubTitle title={title}>
        <RolesForm title={title} />
      </PageSubTitle>

      <div className="page">
        <div className="mb-6 p-3 text-sm">
          Use this page to configure data sharing settings based on your
          organization's role hierarchy. For detailed guidance, please refer to
          the online help documentation.
        </div>
        {loading ? (
          <Loader color="text-gray-400" />
        ) : (
          <RolesTreeView />
        )}
      </div>
    </>
  );
}
