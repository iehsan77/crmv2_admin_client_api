"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import RecordNotFound from "@/components/RecordNotFound";
import { LuBadgeCheck } from "react-icons/lu";
import LoadingSkeletonCard from "@/components/LoadingSkeletonCard";
import { TbRuler2Off } from "react-icons/tb";

export default function RecentActivityCard({ data = {}, loading = true }) {


  console.log("activity data at 11")
  console.log(data)

  return (
    <>
      {loading ? (
        <LoadingSkeletonCard />
      ) : (
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-6">
              {hasRecords(data) ? (
                Object.entries(data || {}).map(([section, items]) =>
                  items.length > 0 ? (
                    <li key={section}>
                      <h3 className="text-sm font-semibold capitalize mb-2">
                        {section.replace("_", " ")}
                      </h3>
                      <ul className="space-y-4">
                        {items.map((item) => (
                          <li key={item.id} className="flex items-start gap-3">
                            <div className="p-2 bg-primary/10 rounded-full">
                              <LuBadgeCheck className="text-primary" />
                            </div>
                            <div>
                              <p className="text-sm">{item.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.description}
                              </p>
                              <p className="text-[10px] text-gray-400">
                                {item.time_ago}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ) : null
                )
              ) : (
                <li className="text-sm text-gray-500">
                  <RecordNotFound simple={true} />
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function hasRecords(records) {
  return Object.values(records || {}).some(
    (arr) => Array.isArray(arr) && arr.length > 0
  );
}
