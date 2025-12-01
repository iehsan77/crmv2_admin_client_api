"use client";

import dynamic from "next/dynamic";
import Button from "@/components/Button";
import { useDrawer } from "@/context/drawer-context";
import ViewModeSwitcher from "@/partials/ViewModeSwitcher";

/**
 * General reusable Actions bar for CRM modules.
 *
 * @param {string} module - module name (e.g. "calls", "tasks", "meetings")
 * @param {string} title - display title (e.g. "Call", "Task", "Meeting")
 * @param {boolean} showViewSwitcher - toggle for showing ViewModeSwitcher
 * @param {boolean} showAddButton - toggle for showing Add button
 * @param {ReactNode} extraActions - any custom buttons or actions (optional)
 */
const ViewSwitcherAddBtn = ({ module, title }) => {
  const { showDrawer } = useDrawer();

  // Dynamically import the correct form component for the given module
  const RecordForm = dynamic(() =>
    import(`@/partials/crm/${module}/RecordForm`).catch(() => {
      console.warn(`⚠️ RecordForm not found for module: ${module}`);
      return () => (
        <div className="p-6 text-red-500">
          Missing form for module: <strong>{module}</strong>
        </div>
      );
    })
  );

  const handleAddClick = () => {
    showDrawer({
      title: `Add ${title}`,
      size: "xl",
      content: <RecordForm />,
    });
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <ViewModeSwitcher />
      <Button onClick={handleAddClick}>Add {title}</Button>
    </div>
  );
};

export default ViewSwitcherAddBtn;
