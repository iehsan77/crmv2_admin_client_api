"use client";

import useUserStore from "@/stores/useUserStore";

export default function Dashboard() {
  const { user, can } = useUserStore();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-lg">
        Loading user data...
      </div>
    );
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <h1 className="text-2xl font-semibold">
        Welcome, {user.name || "User"}!
      </h1>
      <p>This is your dashboard.</p>

      {/* ✅ Conditional block if permission is NOT granted */}
      {!can("dashboard:view") && (
        <p className="text-red-500 text-sm">
          You don't have access to full dashboard features.
        </p>
      )}
    </div>
  );
}
