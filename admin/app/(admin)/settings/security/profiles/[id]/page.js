"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { PageSubTitle } from "@/components/PageTitle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Loader from "@/components/Loader";

import ProfileStats from "@/partials/settings/security/profiles/ProfileStats";
import ProfilePermissions from "@/partials/settings/security/profiles/ProfilePermissions";
import ProfileUsers from "@/partials/settings/security/profiles/ProfileUsers";

import useProfilesStore from "@/stores/settings/useProfilesStore";


export default function Page() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const profilesPath = ADMIN_PATHS?.SETTINGS?.SECURITY?.PROFILES;
  const title = "Profile View";

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  const { fetchProfiles, profilesHasFetched, getProfile } = useProfilesStore();

  // Redirect if ID is missing (after router is ready)
  useEffect(() => {
    if (!id) router.push(profilesPath);
  }, [id, router, profilesPath]);

  // Fetch all profiles on mount
  useEffect(() => {
    async function loadProfiles() {
      setLoading(true);
      await fetchProfiles();
      setLoading(false);
    }
    loadProfiles();
  }, [fetchProfiles]);

  // When profiles are fetched, get and validate the one matching this ID
  useEffect(() => {
    if (profilesHasFetched && id) {
      const profile = getProfile(id);

      if (!profile) {
        router.push(profilesPath);
        return;
      }

      const permissionsStr = profile?.permissions?.permissions;

      // ✅ Safe parsing if string
      if (typeof permissionsStr === "string") {
        try {
          const parsed = JSON.parse(permissionsStr);
          profile.permissions = parsed;
        } catch (err) {
          console.error("Invalid permissions JSON", err);
          profile.permissions = {};
        }
      }

      setRecord(profile);
      setLoading(false);
    }
  }, [profilesHasFetched, id, getProfile, router, profilesPath]);

  return (
    <>
      <PageSubTitle title={title}>
        <Link href={profilesPath} className="border py-1 px-3">
          View All
        </Link>
      </PageSubTitle>

      <div className="page">
        <div className="p-3 text-sm">
          This page displays the details of the selected profile, including assigned permissions, module access, and available operations. It also contains a list of users who are assigned to this profile, allowing you to review who has access under this permission set.
        </div>

        {loading ? (
          <Loader color="text-gray-400" />
        ) : (
          <>
            <ProfileStats record={record} />

            <Tabs defaultValue="permissions">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
              </TabsList>

              <TabsContent value="permissions">
                <ProfilePermissions record={record} />
              </TabsContent>
              <TabsContent value="users">
                <ProfileUsers record={record} />
              </TabsContent>
            </Tabs>

          </>
        )}
      </div>
    </>
  );
}
