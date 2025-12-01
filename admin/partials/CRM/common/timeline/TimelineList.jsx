"use client";

import React from "react";
import TimelineItem from "./TimelineItem";
import RecordNotFound from "@/components/RecordNotFound";

export default function TimelineList({ records = [] }) {
  return (
    <div>
      {records.length > 0 ? (
        records.map((record, i) => (
          <React.Fragment key={record.id || i}>
            <TimelineItem record={record} />
            {i !== records.length - 1 && (
              <div className="border-l-2 border-[#CCE1FF] h-6 ml-8" />
            )}
          </React.Fragment>
        ))
      ) : (
        <RecordNotFound />
      )}
    </div>
  );
}
