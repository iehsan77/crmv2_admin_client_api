import Image from "next/image";

export const columns = [
    {
      name: "#",
      cell: (row, index) => (currentPage - 1) * paginationPerPage + index + 1,
      width: "60px",
      style: { textAlign: "center" },
    },
    {
      name: "Logo",
      selector: (row) => row.logo,
      cell: (row) => (
        <Image src={row.logo} alt={row.title} width="50" height={50} />
      ),
      width: "100px",
      style: { textAlign: "center" },
    },
    { name: "Brand Name", selector: (row) => row.title, sortable: true },

    {
      name: "Actions",
      cell: (row) => (
        <button onClick={() => handleOpenDrawer(row)} className="btn btn-sm">
          Edit
        </button>
      ),
      width: "100px",
      style: { textAlign: "center" },
    },
  ];
