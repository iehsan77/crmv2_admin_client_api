"use client";

import { DocItem } from "@/helper/GeneralFunctions";


const DOCS_CONFIG = {
  company: [
    { label: "Trade License", key: "trade_license" },
    { label: "VAT Certificate", key: "vat_certificate" },
    { label: "Proof of Address", key: "proof_of_address" },
    { label: "Insurance Certificate", key: "insurance_certificate" },
    { label: "Bank AC Verification Document", key: "bank_ac_verification_doc" },
  ],
  individual: [
    { label: "Proof of Address", key: "proof_of_address" },
    { label: "Insurance Certificate", key: "insurance_certificate" },
    { label: "Bank AC Verification Document", key: "bank_ac_verification_doc" },
  ],
};

export default function DocsSection({ record, type = "company" }) {
  const docsList = DOCS_CONFIG[type] || [];

  return (
    <div className="space-y-3">
      {docsList.map(({ label, key }) => (
        <DocItem key={key} label={label} docs={record?.[key]} />
      ))}
    </div>
  );
}
