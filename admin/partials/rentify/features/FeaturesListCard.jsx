"use client";

import { useState } from "react";
import Image from "next/image";

import toast from "react-hot-toast";
import { Trash2, Pencil, Check, XCircle } from "lucide-react";

import Button from "@/components/Button";
import { Card, CardContent } from "@/components/ui/card";
import SegmentedToggle from "@/components/FormFields/SegmentedToggle";

import { cn } from "@/lib/utils";
import { POST, GET } from "@/helper/ServerSideActions";
import { rentify_endpoints } from "@/utils/rentify_endpoints";
import { handleResponse } from "@/helper/ClientSideActions";

import FeaturesForm from "@/partials/rentify/features/FeaturesForm"; // ✅ keep only one import

import useFeaturesStore from "@/stores/rentify/useFeaturesStore";
import useToggleStore from "@/stores/useToggleStore";

import { useDrawer } from "@/context/drawer-context";
import { Badge } from "@/components/Badge";

export default function FeaturesListCard({ record }) {
  const [status, setStatus] = useState(record?.is_used);

  const { showDrawer } = useDrawer();

  const { updateFeature, deleteFeature } = useFeaturesStore();
  const { open, setOnConfirm, setMessage } = useToggleStore();

  const handleStatusChange = async (value) => {
    const body = {
      feature_id: record?.id,
      value: Number(value),
    };

    try {
      const api_url =
        value === 1
          ? rentify_endpoints?.rentify?.features?.SelectForTenant
          : rentify_endpoints?.rentify?.features?.UnselectForTenant;

      const response = await POST(api_url, body);
      console.log(response)
      if (response?.status === 200) {
        const updatedFeature = { ...record, is_used: value };
        updateFeature(updatedFeature);
        setStatus(value);
        toast.success("Status updated successfully");
      } else {
        throw new Error(response?.message || "Update failed");
      }
    } catch (err) {
      console.error("Error updating feature status:", err);
      toast.error("Failed to update status. Please try again.");
    }
  };

  // CHECK PERMISSIONS = starting
  const permission = !record?.is_global;
  // CHECK PERMISSIONS = ending

  // Delete Record = starting
  const handleDelete = (id) => {
    setMessage("Are you sure you want to delete this record?");
    open();
    setOnConfirm(async () => {
      try {
        const response = await GET(
          rentify_endpoints?.rentify?.features?.delete(id)
        );

        if (response?.status === 200) {
          //window.location.reload();
          deleteFeature(id);
        } else {
          toast.error("Sorry, there was a problem deleting the record.");
        }
        toast.success("Record has been deleted successfully.");
      } catch (err) {
        toast.error("An error occurred while deleting the record.");
      }
    });
  };
  // Delete Record = ending

  const isActive = record.active;

  return (
    <Card className="w-full rounded-2xl border px-4 py-3 shadow-none">
      <CardContent
        className={cn(
          "flex flex-col gap-4 md:grid md:grid-cols-3 md:gap-4 px-0"
        )}
      >
        <div className="flex items-center gap-4 min-w-[200px]">
          <h3 className="text-base font-semibold text-primary cursor-pointer">
            {record?.title}
          </h3>
        </div>

        <div className="col-span-2 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{record?.title_ar}</span>
          </div>

          <div className="flex items-center gap-2 justify-center">
            {isActive ? (
              <Badge variant="emerald">Active</Badge>
            ) : (
              <Badge variant="red">Inactive</Badge>
            )}
          </div>

          <div className="flex items-center gap-2 sm:justify-end">
            <SegmentedToggle
              value={record?.is_used}
              onChange={handleStatusChange}
              options={[
                { label: "Off", value: 0 },
                { label: "On", value: 1 },
              ]}
            />
          </div>

          <div className="flex items-center gap-2 sm:justify-end">
            {/* Action Buttons */}
            {!record?.is_global && (
              <div className="flex items-center gap-2 sm:justify-end flex-wrap">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={!permission}
                  onClick={() =>
                    showDrawer({
                      title: "Add Features",
                      size: "xl",
                      content: <FeaturesForm record={record} />,
                    })
                  }
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={!permission}
                  onClick={() => handleDelete(record?.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// "use client";

// import { useState } from "react";
// import Image from "next/image";

// import toast from "react-hot-toast";
// import { Trash2, Pencil } from "lucide-react";

// import Button from "@/components/Button";
// import { Card, CardContent } from "@/components/ui/card";
// import SegmentedToggle from "@/components/FormFields/SegmentedToggle";

// import { cn } from "@/lib/utils";
// import { POST, GET } from "@/helper/ServerSideActions";
// import { rentify_endpoints } from "@/utils/rentify_endpoints";
// import { handleResponse } from "@/helper/ClientSideActions";

// import FeaturesForm from "@/partials/rentify/features/FeaturesForm";

// import useFeaturesStore from "@/stores/rentify/useFeaturesStore";
// import useToggleStore from "@/stores/useToggleStore";

// import { useDrawer } from "@/context/drawer-context";

// export default function FeaturesListCard({ record }) {
//   const [status, setStatus] = useState(record?.is_used);

//   const { showDrawer } = useDrawer();

//   const { updateFeature, deleteFeature } = useFeaturesStore();
//   const { open, setOnConfirm, setMessage } = useToggleStore();

//   const handleStatusChange = async (value) => {
//     const body = {
//       feature_id: record?.id,
//       value,
//     };

//     try {
//       const api_url =
//         value === 1
//           ? rentify_endpoints?.rentify?.features?.SelectForTenant
//           : rentify_endpoints?.rentify?.features?.UnselectForTenant;

//       const response = await POST(api_url, body);

//       if (response?.status === 200) {
//         const updatedFeature = { ...record, is_used: value };
//         updateFeature(updatedFeature);
//         setStatus(value);
//         toast.success("Status updated successfully");
//       } else {
//         throw new Error(response?.message || "Update failed");
//       }
//     } catch (err) {
//       console.error("Error updating feature status:", err);
//       toast.error("Failed to update status. Please try again.");
//     }
//   };

//   // CHECK PERMISSIONS = starting
//   const permission = !record?.is_global;
//   // CHECK PERMISSIONS = ending

//   // Delete Record = starting
//   const handleDelete = (id) => {
//     setMessage("Are you sure you want to delete this record?");
//     open();
//     setOnConfirm(async () => {
//       try {
//         const response = await GET(
//           rentify_endpoints?.rentify?.features?.delete(id)
//         );

//         if (response?.status === 200) {
//           deleteFeature(id);
//         } else {
//           toast.error("Sorry, there was a problem deleting the record.");
//         }
//         toast.success("Record has been deleted successfully.");
//       } catch (err) {
//         toast.error("An error occurred while deleting the record.");
//       }
//     });
//   };
//   // Delete Record = ending

//   return (
//     <Card className="w-full rounded-2xl border px-4 py-3 shadow-none">
//       <CardContent
//         className={cn(
//           "flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-4 px-0"
//         )}
//       >
//         <div className="grid grid-cols-2 gap-4">
//           <div className="flex items-center gap-4 min-w-[200px]">
//             <h3 className="text-base font-semibold text-primary cursor-pointer">
//               {record?.title}
//             </h3>
//           </div>
//           <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
//             <span>{record?.title_ar}</span>
//           </div>
//         </div>

//         <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 gap-4">
//           <div className="flex items-center gap-2 sm:justify-end">
//             {/* Action Buttons */}
//             {!record?.is_global && (
//               <div className="flex items-center gap-2 sm:justify-end flex-wrap">
//                 <Button
//                   variant="outline"
//                   size="icon"
//                   disabled={!permission}
//                   onClick={() =>
//                     showDrawer({
//                       title: "Add Features",
//                       size: "xl",
//                       content: <FeaturesForm record={record} />,
//                     })
//                   }
//                 >
//                   <Pencil className="h-4 w-4" />
//                 </Button>
//                 <Button
//                   variant="outline"
//                   size="icon"
//                   disabled={!permission}
//                   onClick={() => handleDelete(record?.id)}
//                 >
//                   <Trash2 className="h-4 w-4 text-destructive" />
//                 </Button>
//               </div>
//             )}
//           </div>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }
