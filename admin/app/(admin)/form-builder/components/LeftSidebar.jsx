"use client";

import { useEffect, useState, useCallback } from "react";
import { Icon } from "@iconify/react";
import * as Icons from "lucide-react";

import LineSeparator from "@/components/LineSperator";
import Loader from "@/components/Loader";

import { crm_endpoints } from "@/utils/crm_endpoints";
import { POST_JSON } from "@/helper/ServerSideActions";

import toast from "react-hot-toast";

export const LeftSidebar = ({ formSection = [], onAddSection }) => {
  const [loading, setLoading] = useState(true);
  const [fbFields, setFbFields] = useState([]);

  useEffect(() => {
    const fetchFields = async () => {
      try {
        const res = await POST_JSON(crm_endpoints?.formBuilderFields?.withAttributes);
        if (res?.status === 200) {
          setFbFields(res.data || []);
        } else {
          toast.error(res?.message || "Failed to fetch fields");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        toast.error("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchFields();
  }, []);

  const handleFieldDragStart = useCallback((e, field) => {
    e.dataTransfer.setData("field", JSON.stringify(field));
  }, []);

  const handleSectionDragStart = useCallback((e, section) => {
    e.dataTransfer.setData("section", JSON.stringify(section));
  }, []);

  const renderFieldItem = useCallback((field) => {
    const LucideIcon = Icons[field?.icon];
    return (
      <div
        key={field.id}
        className="p-2 bg-white rounded border border-gray-200 cursor-move hover:bg-gray-50"
        draggable
        onDragStart={(e) => handleFieldDragStart(e, field)}
      >
        <div className="flex items-center gap-x-2">
          {LucideIcon && <LucideIcon size={16} />}
          <span className="text-xs">{field.title}</span>
        </div>
      </div>
    );
  }, [handleFieldDragStart]);

  const renderSectionItem = useCallback((section) => (
    <div
      key={section.id}
      className="p-2 bg-white rounded border border-gray-200 cursor-move hover:bg-gray-50"
      draggable
      onDragStart={(e) => handleSectionDragStart(e, section)}
    >
      <div className="flex items-center gap-x-2">
        <Icon icon={section?.icon} width={16} height={16} />
        <span className="text-xs">{section.title}</span>
      </div>
    </div>
  ), [handleSectionDragStart]);

  return (
    <div className="w-80 p-4 bg-[#3369bd] overflow-y-auto h-full">
      <h2 className="text-lg font-bold mb-4 text-white">Form Fields</h2>
      <LineSeparator />

      <div className={`grid ${loading ? "grid-cols-1" : "grid-cols-2"} gap-1 mb-4`}>
        {loading ? (
          <Loader color="text-white" />
        ) : (
          fbFields.map(renderFieldItem)
        )}
      </div>

      <LineSeparator />

      <div className="grid grid-cols-1 gap-1">
        {formSection.map(renderSectionItem)}
      </div>
    </div>
  );
};
