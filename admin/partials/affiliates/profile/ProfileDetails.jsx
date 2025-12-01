"use client";
import { useMemo, useEffect, useState } from "react";
import Link from "next/link";

import RadioSelectionButton from "@/components/FormFields/RadioSelectionButton";
import { DocItem, formatDate } from "@/helper/GeneralFunctions";

import toast from "react-hot-toast";

import { POST } from "@/helper/ServerSideActions";
import { rentify_endpoints } from "@/utils/rentify_endpoints";

import useAffiliateStore from "@/stores/rentify/affiliates/useAffiliateStore";
import DocsSection from "../DocsSection";

export default function ProfileDetails({ affiliate }) {
  const [affiliateStatus, setAffiliateStatus] = useState(null);

  const fields = useMemo(() => {
    if (!affiliate) return [];

    if (affiliate?.is_company) {
      return [
        {
          label: "Company Name",
          value: affiliate?.company_name || "-",
        },
        { label: "Phone", value: affiliate?.phone || "-" },
        { label: "Email", value: affiliate?.email || "-" },
        {
          label: "Business Address",
          value: affiliate?.business_address || "-",
        },
        { label: "Mailing Address", value: affiliate?.mailing_address || "-" },
        {
          label: "Trade License Number",
          value: affiliate?.trade_license_no || "-",
        },
        {
          label: "Trade License Expiry",
          value: formatDate(affiliate?.trade_license_expiry) || "-",
        },
        {
          label: "VAT Registration Number",
          value: affiliate?.vat_registration_no || "-",
        },
        {
          label: "Trade License Expiry",
          value: formatDate(affiliate?.vat_registration_expiry) || "-",
        },
      ];
    }

    return [
      {
        label: "First Name",
        value: affiliate?.first_name || "-",
      },
      {
        label: "Last Name",
        value: affiliate?.last_name || "-",
      },
      { label: "Phone", value: affiliate?.phone || "-" },
      { label: "Email", value: affiliate?.email || "-" },
      {
        label: "Driving License Number",
        value: affiliate?.driving_license_no || "-",
      },
      {
        label: "Driving License Expiry",
        value: formatDate(affiliate?.driving_license_expiry) || "-",
      },
      { label: "Address", value: affiliate?.business_address || "-" },
    ];
  }, [affiliate]);

  const { fetchAffiliate } = useAffiliateStore();

  const handleStatusChange = async (id, value) => {
    try {
      const body = {
        id: id,
        active: value,
      };

      const response = await POST(
        rentify_endpoints?.rentify?.affiliates?.changeActiveStatus,
        body
      );
      if (response?.status === 200) {
        fetchAffiliate(id);
        setAffiliateStatus(value);
        toast.success(response?.message);
      } else {
        toast.error(response?.message);
      }
    } catch (error) {
      console.error("Status change failed:", error);
      toast.error("Failed to update affiliate status");
    }
  };

  useEffect(() => {
    setAffiliateStatus(affiliate?.active);
  }, [affiliate]);

  return (
    <div className="px-4 py-3 text-sm">
      <details open>
        <summary className="cursor-pointer font-medium text-muted-foreground">
          About This Affiliate
        </summary>
        <div className="mt-3 space-y-3">
          <RadioSelectionButton
            options={[
              { label: "Active", value: 1 },
              { label: "Inactive", value: 0 },
            ]}
            value={affiliateStatus}
            onChange={(value) => handleStatusChange(affiliate?.id, value)}
          />

          {/* Fields */}
          {fields.map((item, idx) => (
            <div key={idx}>
              <p className="font-medium text-primary">{item.label}</p>
              <p>{item.value}</p>
            </div>
          ))}

          {/* Company vs Individual Docs */}
          {affiliate?.is_company ? (
            <DocsSection type="company" record={affiliate} />
          ) : (
            <DocsSection type="individual" record={affiliate} />
          )}
        </div>
      </details>
    </div>
  );
}
