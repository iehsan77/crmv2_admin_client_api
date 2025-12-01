"use client";

import { useState, useEffect } from "react";
import Filters from "./Filters";
import { DataTable } from "@/components/DataTable";
import Pagination from "@/components/Pagination";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Button from "@/components/Button";
import { Plus, Eye, Edit, Trash2 } from "lucide-react";
import { Icon } from "@iconify/react";
import { useDrawer } from "@/context/drawer-context";

const CustomerAttachments = () => {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(attachments.length / itemsPerPage);
  const { hideDrawer } = useDrawer();

  // ✅ Fetch Attachments (Fake API)
  const fetchAttachments = async () => {
    // try {
    //   setLoading(true);
    //   const response = await getAttachments();
    //   if (response.status === 200) {
    //     setAttachments(response.data);
    //   } else {
    //     console.error("Error:", response.error);
    //   }
    // } catch (error) {
    //   console.error("Unexpected error:", error);
    // } finally {
    //   setLoading(false);
    // }

    setLoading(true);
    setTimeout(() => {
      setAttachments(
        Array.from({ length: 25 }).map((_, i) => ({
          id: i + 1,
          fileName: `Document_${i + 1}.pdf`,
          attachedBy: `User ${(i % 5) + 1}`,
          dateAdded: new Date(Date.now() - i * 86400000).toLocaleDateString(),
          size: `${(i % 10) + 1}.${i % 10} MB`,
          fileType: i % 3 === 0 ? "PDF" : i % 3 === 1 ? "DOC" : "XLS",
        }))
      );
      setLoading(false);
    }, 1000);
  };

  // ✅ Add Attachment
  const addAttachment = async (file) => {
    // try {
    //   const response = await createAttachment(file);
    //   if (response.status === 201) {
    //     setAttachments((prev) => [response.data, ...prev]);
    //   } else {
    //     console.error("Error:", response.error);
    //   }
    // } catch (error) {
    //   console.error("Unexpected error:", error);
    // }
    return new Promise((resolve) => {
      setTimeout(() => {
        const newAttachment = {
          id: Date.now(),
          fileName: file?.name || "New_File.pdf",
          attachedBy: "You",
          dateAdded: new Date().toLocaleDateString(),
          size: "1.2 MB",
          fileType: "PDF",
        };
        setAttachments((prev) => [newAttachment, ...prev]);
        resolve(newAttachment);
        hideDrawer();
      }, 500);
    });
  };

  useEffect(() => {
    fetchAttachments();
  }, []);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // ✅ Slice paginated data
  const currentAttachments = attachments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ✅ Table Columns
  const columns = [
    {
      accessorKey: "fileName",
      header: "File Name",
      size: 250,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Icon icon="ph:folders" width={18} height={18} />{" "}
          {row.original.fileName}
        </div>
      ),
    },
    {
      accessorKey: "attachedBy",
      header: "Attached By",
      size: 150,
    },
    {
      accessorKey: "dateAdded",
      header: "Date Added",
      size: 120,
    },
    {
      accessorKey: "size",
      header: "Size",
      size: 100,
      cell: ({ row }) => (
        <span className="text-gray-600 font-medium">{row.original.size}</span>
      ),
    },
    {
      accessorKey: "actions",
      header: "Actions",
      size: 180,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Card className="gap-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-gray-900">Attachments</h2>
          <Button onClick={() => addAttachment({ name: "Manual_Upload.pdf" })}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Filters />

        {loading ? (
          <p className="text-sm text-gray-500 mt-4">Loading attachments...</p>
        ) : (
          <>
            <DataTable columns={columns} data={currentAttachments} />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerAttachments;


// "use client";
// import { useState } from "react";
// import Filters from "./Filters";
// import { DataTable } from "@/components/DataTable";
// import Pagination from "@/components/Pagination";
// import Image from "next/image";
// import Link from "next/link";
// import { Card, CardContent, CardHeader } from "@/components/ui/card";
// import Button from "@/components/Button";
// import { Plus, Eye, Download, File, Edit, Trash2 } from "lucide-react";
// import { Icon } from "@iconify/react";

// const CustomerAttachments = () => {
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 5;

//   // Mock data for attachments
//   const attachments = Array.from({ length: 25 }).map((_, i) => ({
//     id: i + 1,
//     fileName: `Document_${i + 1}.pdf`,
//     attachedBy: `User ${(i % 5) + 1}`,
//     dateAdded: new Date(Date.now() - i * 86400000).toLocaleDateString(),
//     size: `${(i % 10) + 1}.${i % 10} MB`,
//     fileType: i % 3 === 0 ? "PDF" : i % 3 === 1 ? "DOC" : "XLS",
//   }));

//   const totalPages = Math.ceil(attachments.length / itemsPerPage);
//   const currentAttachments = attachments.slice(
//     (currentPage - 1) * itemsPerPage,
//     currentPage * itemsPerPage
//   );

//   const handlePageChange = (page) => {
//     if (page >= 1 && page <= totalPages) {
//       setCurrentPage(page);
//     }
//   };

//   // Columns according to the requested fields
//   const columns = [
//     {
//       accessorKey: "fileName",
//       header: "File Name",
//       size: 250,
//       minSize: 200,
//       cell: ({ row }) => (
//         <div className="flex items-center gap-2">
//           <Icon icon="ph:folders" width={18} height={18} />{" "}
//           {row.original.fileName}
//         </div>
//       ),
//     },
//     {
//       accessorKey: "attachedBy",
//       header: "Attached By",
//       size: 150,
//       minSize: 120,
//       // cell: ({ row }) => (
//       //   <div className="flex items-center gap-2">
//       //     <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-medium text-sm">
//       //       {row.original.attachedBy.charAt(0)}
//       //     </div>
//       //     <span className="text-gray-700">{row.original.attachedBy}</span>
//       //   </div>
//       // ),
//     },
//     {
//       accessorKey: "dateAdded",
//       header: "Date Added",
//       size: 120,
//       minSize: 100,
//     },
//     {
//       accessorKey: "size",
//       header: "Size",
//       size: 100,
//       minSize: 80,
//       cell: ({ row }) => (
//         <span className="text-gray-600 font-medium">{row.original.size}</span>
//       ),
//     },
//     // {
//     //   accessorKey: "fileType",
//     //   header: "File Type",
//     //   size: 100,
//     //   minSize: 80,
//     //   cell: ({ row }) => (
//     //     <span
//     //       className={`px-2 py-1 rounded-full text-xs font-medium ${
//     //         row.original.fileType === "PDF"
//     //           ? "bg-red-100 text-red-800"
//     //           : row.original.fileType === "DOC"
//     //           ? "bg-blue-100 text-blue-800"
//     //           : "bg-green-100 text-green-800"
//     //       }`}
//     //     >
//     //       {row.original.fileType}
//     //     </span>
//     //   ),
//     // },
//     {
//       accessorKey: "actions",
//       header: "Actions",
//       size: 180,
//       minSize: 150,
//       cell: ({ row }) => (
//         <div className="flex items-center gap-2">
//           <Button variant="outline" size="icon">
//             <Edit className="h-4 w-4" />
//           </Button>
//           <Button variant="outline" size="icon">
//             <Eye className="h-4 w-4" />
//           </Button>
//           <Button variant="outline" size="icon">
//             <Trash2 className="h-4 w-4" />
//           </Button>
//         </div>
//       ),
//     },
//   ];

//   return (
//     <Card className="gap-2">
//       <CardHeader>
//         <div className="flex items-center justify-between">
//           <h2 className="text-base font-medium text-gray-900">Attachments</h2>
//           <Button>
//             <Plus className="w-4 h-4 mr-1" />
//             Add
//           </Button>
//         </div>
//       </CardHeader>
//       <CardContent>
//         <Filters />

//         <DataTable columns={columns} data={currentAttachments} />

//         <Pagination
//           currentPage={currentPage}
//           totalPages={totalPages}
//           onPageChange={handlePageChange}
//         />
//       </CardContent>
//     </Card>
//   );
// };

// export default CustomerAttachments;
