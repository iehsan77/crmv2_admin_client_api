"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/helper/GeneralFunctions";
import { Trash2 } from "lucide-react";

export default function TimelineItem({ record = [] }) {
  const { title, description, author, createdon } = record;

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
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
            <span className="text-xs text-gray-400">{formatDateTime(createdon, "dd-MMM-yyyy hh:mm:a")}</span>
          </div>
        </div>

        {/* Body */}
        <div className="mt-2 text-sm text-gray-700">{description}</div>
      </CardContent>
    </Card>
  );
}
