import SettingsLayout from "@/components/Layout/Admin/SettingsLayout";

export default function AdminLayout({ children }) {
  return (
    <SettingsLayout>
      <div className="setting-contents">{children}</div>
    </SettingsLayout>
  );
}
