"use client";
import React, { useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import Link from "next/link";
import Image from "next/image";

import { getDate, getFormatedNameEmail } from "@/helper/EcomActions";

const Template = React.forwardRef(({ record }, ref) => {
  const title = "Quotation";

  // Safe JSON Parsing Function
  const safeParseJSON = (data, fallback = []) => {
    try {
      return JSON.parse(data);
    } catch {
      return fallback;
    }
  };

  return (
    <div ref={ref} className="p-5 bg-white shadow-md w-[800px]">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-gray-600 text-sm">{title} # {record?.quotation_no}</p>
          <p className="text-gray-600 text-sm">
            {title} Date: {record?.date ? getDate(record?.date) : "-"}
          </p>
        </div>
        <Image
          src="/images/short-logo.png"
          alt="Company Logo"
          className="h-16"
          width={50}
          height={50}
        />
      </div>

      {/* Address Information */}
      <div className="grid grid-cols-2 gap-4 border p-2 bg-gray-100">
        {["Billing", "Shipping"].map((type) => (
          <div key={type}>
            <h3 className="font-semibold">{type} Address</h3>
            <p className="text-gray-600 text-sm">
              {record?.[`${type.toLowerCase()}_street`]} <br />
              {`${record?.[`${type.toLowerCase()}_code`] || ""} 
                ${record?.[`${type.toLowerCase()}_city`] || ""} 
                ${record?.[`${type.toLowerCase()}_state`] || ""} 
                ${record?.[`${type.toLowerCase()}_country`] || ""}`.trim()}
            </p>
          </div>
        ))}
      </div>

      {/* Item Table */}
      <table className="w-full border mt-6 text-sm">
        <thead className="bg-gray-800 text-white">
          <tr>
            {["#", "Product/Service", "Qty.", "Price", "Amount", "Discount", "Tax", "Total"].map((col) => (
              <th key={col} className="p-2 text-center">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {safeParseJSON(record?.items).map((item, index) => (
            <tr key={index} className="border">
              <td className="p-2 text-center">{index + 1}</td>
              <td className="p-2">
                {item?.product?.label}
                <p>{item?.description}</p>
              </td>
              <td className="p-2 text-center">{item?.quantity}</td>
              <td className="p-2 text-end">{item?.price}</td>
              <td className="p-2 text-end">{item?.amount}</td>
              <td className="p-2 text-end">{item?.discount}</td>
              <td className="p-2 text-end">{item?.tax}</td>
              <td className="p-2 text-end">{item?.total}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total Calculation */}
      <div className="flex">
        <div className="w-7/12"></div>
        <div className="w-5/12">
          <div className="mt-2 text-sm">
            {["subtotal", "discount", "tax"].map((key) => (
              <div key={key} className="flex justify-between border-t p-2">
                <span>{key.replace("_", " ").toUpperCase()}:</span>
                <span>{record?.[key]}</span>
              </div>
            ))}
            <div className="flex justify-between border-t p-2 font-bold text-md">
              <span>Grand Total:</span>
              <span>{record?.grand_total}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Terms & Conditions */}
      {["terms_conditions", "description"].map((key) => (
        <div key={key} className="mt-6">
          <h3 className="font-semibold text-sm">
            {key.replace("_", " ").toUpperCase()}
          </h3>
          <p className="text-gray-600 text-sm">{record?.[key]}</p>
        </div>
      ))}

      {/* Footer */}
      <div className="flex justify-between mt-6">
        <p className="text-sm">
          For any inquiries, email us at <span className="font-bold">{record?.company?.email}</span>
        </p>
        <div className="text-right">
          <p className="font-semibold text-sm">Authorized Signature</p>
          <Image
            src="/images/signature.png"
            alt="Signature"
            className="h-16"
            width={100}
            height={100}
          />
        </div>
      </div>
    </div>
  );
});
Template.displayName = "Template";

const printTemplate = ({ record }) => {
  const componentRef = useRef();
  const [emailSent, setEmailSent] = useState(false);

  // Function to download PDF
  const handleDownloadPDF = async () => {
    const element = componentRef.current;
    if (!element) return;

    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`quotation_${record?.quotation_no}.pdf`);
    } catch (error) {
      console.error("PDF Generation Error:", error);
    }
  };

  const handleSendEmail = () => {
    
    // Simulate an API Call to Send Email
    setTimeout(() => {
      setEmailSent(true);
      alert("Email sent successfully!");
    }, 1000);
  };

  return (
    <>
      <div className="text-center space-x-4 mb-6">
        <button
          onClick={handleDownloadPDF}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg mt-4"
        >
          Download PDF
        </button>
        <button
          onClick={handleSendEmail}
          className="bg-green-500 text-white px-4 py-2 rounded-lg"
        >
          Send Email
        </button>
      </div>
      <div className="flex flex-col items-center">
        <Template ref={componentRef} record={record} />
      </div>
    </>
  );
};

export default printTemplate;
