"use client";

import React from "react";
import TimelineItem from "./TimelineItem";
import useAccountsStore from "@/stores/crm/useAccountsStore";
import RecordNotFound from "@/components/RecordNotFound";

export default function TimelineList() {
  const record = useAccountsStore((s) => s.recordDetails);
  const logs = record?.activity_logs || [];
  return (
    <div>
      {logs.length > 0 ? (
        logs.map((item, i) => (
          <React.Fragment key={item.id || i}>
            <TimelineItem
              title={item?.title}
              description={item?.description}
              date={item?.createdon}
              author={item?.author}
              isNote={item?.isNote}
              onDelete={() => alert(`Deleted ${item?.title}`)}
            />
            {/* Draw connector line unless this is the last item */}
            {i !== logs.length - 1 && (
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
