"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { PageSubTitle } from "@/components/PageTitle";
import { CompaniesForm } from "@/partials/settings/general/companies/CompaniesForm";
import useCompaniesStore from "@/stores/settings/useCompaniesStore";
import Loader from "@/components/Loader";
import CompaniesSidebar from "@/partials/settings/general/companies/CompaniesSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { formatIndustryName } from "@/helper/GeneralFunctions";

import { FaRegEdit, FaRegTrashAlt, FaTrashRestoreAlt } from "react-icons/fa";

import useToggleStore from "@/stores/useToggleStore";

// Reusable info item component
const InfoItem = ({ label, value }) => (
  <div>
    <span className="font-medium text-foreground">{label}:</span> {value || "-"}
  </div>
);

// Reusable section component
const InfoSection = ({ title, items }) => (
  <section>
    <h3 className="text-md font-semibold text-muted-foreground mb-2 mt-6">
      {title}
    </h3>
    <div className="grid grid-cols-1 gap-y-2 text-sm pl-6">
      {items.map((item, index) => (
        <InfoItem key={index} label={item.label} value={item.value} />
      ))}
    </div>
  </section>
);

export default function Page() {
  const title = "Companies";
  const [loading, setLoading] = useState(true);

  const { companies, fetchCompanies, viewCompany, deleteCompany, restoreCompany, setSelectedCompany } = useCompaniesStore();
  const { open, setOnConfirm, setMessage } = useToggleStore();

  useEffect(() => {
    const loadCompanies = async () => {
      await fetchCompanies();
      setLoading(false);
    };

    loadCompanies();
  }, [fetchCompanies]);


  const handleDelete = (viewCompany) => {
    setMessage(
      "Are you sure you want to delete '" + viewCompany?.company_name + "' company?"
    );
    setOnConfirm(() => deleteCompany(viewCompany?.id));
    open();
  };
  const handleRestore = (viewCompany) => {
    setMessage(
      "Are you sure you want to restore '" + viewCompany?.company_name + "' company?"
    );
    setOnConfirm(() => restoreCompany(viewCompany?.id));
    open();
  };
  const handleEdit = (viewCompany) => {
    setSelectedCompany(viewCompany);
  };

  return (
    <>
      <PageSubTitle title={title}>
        <CompaniesForm title={title} />
      </PageSubTitle>

      <div className="page">
        <SidebarProvider>
          <CompaniesSidebar />
          <SidebarInset>
            <div className="flex flex-1 flex-col gap-6 p-6">
              {loading ? (
                <Loader color="text-gray-300" />
              ) : viewCompany ? (
                <div className="space-y-6">
                  {/* Company Header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center shadow-lg justify-center text-xl font-bold text-white overflow-hidden">
                      {viewCompany.logo ? (
                        <Image
                          src={viewCompany.logo}
                          alt={viewCompany.company_name || "Company Logo"}
                          width={64}
                          height={64}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        viewCompany.company_name?.charAt(0)
                      )}
                    </div>
                    <div className="flex flex-col gap-1 flex-grow">
                      <h2 className="text-xl font-semibold text-foreground">
                        {viewCompany.company_name}
                      </h2>
                      {viewCompany.industry && (
                        <p className="text-sm text-muted-foreground">
                          {formatIndustryName(viewCompany.industry)}
                        </p>
                      )}
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2">
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleEdit(viewCompany)}
                      >
                        <FaRegEdit />
                      </button>
                      <button
                        className="btn btn-sm text-red"
                        onClick={() => handleDelete(viewCompany)}
                      >
                        <FaRegTrashAlt />
                      </button>
                    </div>
                  </div>

                  {/* Sections */}
                  <InfoSection
                    title="Company Information"
                    items={[
                      { label: "Size", value: viewCompany.company_size },
                      {
                        label: "Industry",
                        value: formatIndustryName(viewCompany.industry),
                      },
                    ]}
                  />

                  <InfoSection
                    title="Location"
                    items={[
                      { label: "Address", value: viewCompany.address },
                      { label: "City", value: viewCompany.city },
                      { label: "State", value: viewCompany.state },
                      { label: "Country", value: viewCompany.country },
                    ]}
                  />

                  <InfoSection
                    title="Contact Information"
                    items={[
                      { label: "Website", value: viewCompany.website },
                      { label: "Email", value: viewCompany.email },
                      { label: "Phone", value: viewCompany.phone },
                      { label: "Fax", value: viewCompany.fax },
                      {
                        label: "Contact Person",
                        value: viewCompany.contact_person,
                      },
                    ]}
                  />
                </div>
              ) : (
                <p className="text-muted-foreground">No company selected.</p>
              )}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </>
  );
}
