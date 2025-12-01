"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { LuTrash2 } from "react-icons/lu";
//import { useRouter } from "next/navigation";

import { SortableItem } from "./SortableItem";
import { LeftSidebar } from "./LeftSidebar";
import { RightSidebar } from "./RightSidebar";
import { formSection } from "@/components/FormBuilder/mock/systemDefinedFields";

export const FormBuilder = ({ formFields, setFormFields }) => {

  const [selectedField, setSelectedField] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);

  // Memoized sensors to prevent recreation on every render
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const storedData = localStorage.getItem("formBuilderData");
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        if (Array.isArray(parsed)) setFormFields(parsed);
      } catch (err) {
        console.error("Failed to parse saved form builder data", err);
      }
    }
    return () => localStorage.removeItem("formBuilderData");
  }, [setFormFields]);

  const handleDragEnd = useCallback((event, sectionId) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setFormFields(prev =>
      prev.map(section =>
        section.id !== sectionId
          ? section
          : {
              ...section,
              fields: arrayMove(
                section.fields,
                section.fields.findIndex(f => f.id === active.id),
                section.fields.findIndex(f => f.id === over.id)
              ),
            }
      )
    );
  }, [setFormFields]);

  const addFieldToForm = useCallback((field, sectionId) => {
    const newField = { ...field, id: `field-${Date.now()}` };
    setFormFields(prev =>
      prev.map(section =>
        section.id === sectionId
          ? { ...section, fields: [...section.fields, newField] }
          : section
      )
    );
  }, [setFormFields]);

  const updateFieldAttribute = useCallback((sectionId, fieldId, attrId, value) => {
    setFormFields(prev =>
      prev.map(section =>
        section.id === sectionId
          ? {
              ...section,
              fields: section.fields.map(field =>
                field.id === fieldId
                  ? {
                      ...field,
                      attributes: field.attributes.map(attr =>
                        attr.id === attrId ? { ...attr, value } : attr
                      ),
                    }
                  : field
              ),
            }
          : section
      )
    );
  }, [setFormFields]);

  const removeFieldFromForm = useCallback((sectionId, fieldId) => {
    setFormFields(prev =>
      prev.map(section =>
        section.id === sectionId
          ? {
              ...section,
              fields: section.fields.filter(f => f.id !== fieldId),
            }
          : section
      )
    );
    if (selectedField?.id === fieldId) {
      setSelectedField(null);
      setSelectedSection(null);
    }
  }, [selectedField]);

  const handleAddSection = useCallback(section => {
    setFormFields(prev => [
      ...prev,
      { ...section, id: `sec-${Date.now()}`, column: 2, fields: [] },
    ]);
  }, [setFormFields]);

  const updateSectionTitle = useCallback((sectionId, title) => {
    setFormFields(prev =>
      prev.map(section =>
        section.id === sectionId ? { ...section, title } : section
      )
    );
  }, [setFormFields]);

  const removeSection = useCallback(sectionId => {
    if (confirm("Are you sure you want to delete this section?")) {
      setFormFields(prev => prev.filter(section => section.id !== sectionId));
      if (selectedSection?.id === sectionId) {
        setSelectedField(null);
        setSelectedSection(null);
      }
    }
  }, [selectedSection]);

  const findFieldAttr = useCallback((sectionId, fieldId, attrId) => {
    const section = formFields.find(s => s.id === sectionId);
    const field = section?.fields.find(f => f.id === fieldId);
    return field?.attributes?.find(a => a.id === attrId) || {};
  }, [formFields]);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left Sidebar */}
      <div className="sticky left-0 h-[calc(100vh-4rem)] overflow-y-auto">
        <LeftSidebar formSection={formSection} onAddSection={handleAddSection} />
      </div>

      {/* Builder Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {formFields && formFields.map(section => (
          <div
            key={section.id}
            className="p-4 border border-dashed border-gray-400 rounded"
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              try {
                const field = JSON.parse(e.dataTransfer.getData("field"));
                addFieldToForm(field, section.id);
              } catch (err) {
                console.warn("Invalid field drop", err);
              }
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <input
                type="text"
                value={section.title}
                onChange={e => updateSectionTitle(section.id, e.target.value)}
                className="font-semibold text-lg border-b border-gray-300 focus:outline-none focus:border-blue-500"
              />
              <LuTrash2
                onClick={() => removeSection(section.id)}
                title={`Remove section ${section.title}`}
                className="ml-2 text-red-600 hover:text-red-800 cursor-pointer"
              />
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={e => handleDragEnd(e, section.id)}
            >
              <SortableContext
                items={section.fields.map(f => f.id)}
                strategy={rectSortingStrategy}
              >
                <div className={`grid grid-cols-${section.column} me here gap-4`}>
                  {section.fields.map(field => (
                    <SortableItem
                      key={field.id}
                      id={field.id}
                      field={field}
                      isSelected={selectedField?.id === field.id}
                      onSelect={() => {
                        setSelectedField(field);
                        setSelectedSection(section);
                      }}
                      onAttributeChange={updateFieldAttribute}
                      onRemove={() => removeFieldFromForm(section.id, field.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {section.fields.length === 0 && (
              <div className="flex items-center justify-center h-64 border border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500">Drag and drop fields here</p>
              </div>
            )}
          </div>
        ))}

        <div
          className="p-4 border border-dashed border-gray-400 text-center text-gray-600 rounded"
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault();
            try {
              const sec = JSON.parse(e.dataTransfer.getData("section"));
              handleAddSection(sec);
            } catch (err) {
              console.warn("Invalid section drop", err);
            }
          }}
        >
          Drop new section here
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="sticky right-0 h-[calc(100vh-4rem)] overflow-y-auto w-80 border-l border-gray-200 bg-white">
        {selectedField ? (
          <RightSidebar
            selectedField={selectedField}
            selectedSection={selectedSection}
            updateFieldAttribute={updateFieldAttribute}
            findFieldAttr={findFieldAttr}
          />
        ) : (
          <div className="flex items-center justify-center h-full p-6 text-gray-400 italic">
            Select a field to view/edit attributes
          </div>
        )}
      </div>
    </div>
  );
};
