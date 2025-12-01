"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Trash2 } from "lucide-react";

export default function TimelineItem({
  title,
  description,
  author,
  date,
  isNote = false,
  icon: Icon,
  onDelete,
}) {
  return (
    <Card>
      <CardContent>
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-[#1E3A8A]" />}
            <div>
              <h3 className="text-sm font-semibold text-[#1E3A8A]">{title}</h3>
              {author && (
                <p className="text-xs text-gray-500">
                  by <span className="font-medium">{author}</span>
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{date}</span>
            {isNote && (
              <button
                onClick={onDelete}
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="mt-2 text-sm text-gray-700">{description}</div>
      </CardContent>
    </Card>
  );
}
