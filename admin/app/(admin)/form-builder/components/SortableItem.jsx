import { useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DropdownMenu from "./DropdownMenu";

export const SortableItem = ({
  id,
  field,
  isSelected,
  onSelect,
  dropPosition,
  onRemove,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const label = useMemo(() => {
    return (
      field?.attributes?.find((a) => a.attribute === "label")?.value ||
      field?.title
    );
  }, [field]);

  const menuItems = useMemo(() => [
    { label: "Settings", onClick: onSelect },
    { label: "Remove", onClick: onRemove },
  ], [onSelect, onRemove]);

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {dropPosition === "before" && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 z-10" />
      )}

      <div
        onClick={onSelect}
        className={`py-1 px-2 bg-white rounded border grid grid-cols-3 items-center transition-all ${
          isSelected ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200"
        }`}
      >
        <label className="text-sm font-medium text-gray-700 cursor-pointer">
          {label}
        </label>

        <div
          {...attributes}
          {...listeners}
          className="text-sm flex justify-center items-center text-gray-400 cursor-grab"
        >
          {field.title}
        </div>

        <div className="flex justify-end cursor-pointer">
          <DropdownMenu items={menuItems} />
        </div>
      </div>

      {dropPosition === "after" && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 z-10" />
      )}
    </div>
  );
};
