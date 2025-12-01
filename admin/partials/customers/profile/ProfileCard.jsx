"use client";

import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import ProfileHeader from "./ProfileHeader";
import ProfileActions from "./ProfileActions";

import useCustomersStore from "@/stores/customers/useCustomersStore";
import { DocItem } from "@/helper/GeneralFunctions";

/* ---------------- Docs Config --------------- */
const DOCS_CONFIG = {
  company: [
    { label: "Trade License", key: "trade_license" },
    { label: "Owner Document", key: "owner_document" },
  ],
  individual: [
    { label: "Driving License", key: "driving_license" },
    { label: "Registration Document", key: "registration_document" },
  ],
};

/* ---------------- Docs Section Component --------------- */
function DocsSection({ record, type }) {
  const docsList = DOCS_CONFIG[type] || [];

  return (
    <div className="space-y-3">
      {docsList.map(({ label, key }) => (
        <DocItem key={key} label={label} docs={record?.[key]} />
      ))}
    </div>
  );
}

/* ---------------- Main Component --------------- */
export default function CustomerCard() {
  const { id } = useParams();
  const { customer } = useCustomersStore();

  const companyFields = [
    { label: "Email", value: customer?.email },
    { label: "Trade License Number", value: customer?.tradeLicense?.number },
    { label: "Trade License Expiry Date", value: customer?.tradeLicense?.expiry },
    { label: "Contact ID / Passport Number", value: customer?.contactId?.number },
    { label: "Contact ID / Passport Expiry Date", value: customer?.contactId?.expiry },
    { label: "Nationality / Registration", value: customer?.nationality },
    { label: "Address", value: customer?.address },
    { label: "Postal Code", value: customer?.postalCode },
    { label: "Trade License", value: customer?.documents?.tradeLicense },
    { label: "ID / Passport / VISA", value: customer?.documents?.idOrVisa },
  ];

  const clientFields = [
    { label: "Email", value: customer?.email },
    { label: "Contact Number", value: customer?.contact },
    { label: "Driving License Number", value: customer?.driving_license_no },
    { label: "Driving License Expiry", value: customer?.driving_license_expiry },
    { label: "Address", value: `${customer?.address1 || ""} ${customer?.address2 || ""}`.trim() },
  ];

  const fields = customer?.is_company === "1" ? companyFields : clientFields;

  return (
    <Card className="sticky top-20 w-72 h-[85vh] rounded-lg shadow-md border p-0 flex flex-col">
      <CardContent className="p-0 flex flex-col flex-1 h-full">
        <ProfileHeader customer={customer} />
        <ProfileActions customer={customer} />

        <hr className="mx-4" />

        {/* Scrollable Content */}
        <div className="flex-1 h-full overflow-y-auto">
          <div className="px-4 py-3 text-sm space-y-6">

            {/* About Section */}
            <details open>
              <summary className="cursor-pointer font-medium text-muted-foreground">
                About This {customer?.is_company === "1" ? "Company" : "Customer"}
              </summary>
              <div className="mt-3 space-y-3">
                {fields.map((item, idx) => (
                  <div key={idx}>
                    <p className="font-medium text-primary">{item.label}</p>
                    <p>{item.value || "-"}</p>
                  </div>
                ))}
              </div>
            </details>

            {/* Documents Section */}
            <DocsSection
              type={customer?.is_company === "1" ? "company" : "individual"}
              record={customer}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
