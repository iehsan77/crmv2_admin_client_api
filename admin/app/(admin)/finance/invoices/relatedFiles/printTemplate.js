"use client";
import React, { useRef, useState, useCallback } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import Image from "next/image";
import { getDate } from "@/helper/EcomActions";

const Template = React.forwardRef(({ record }, ref) => {

  const title = "Invoice";

  return (
    <div ref={ref} className="p-5 bg-white shadow-md w-[800px]">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-gray-600 text-sm">
            {title} # {record?.invoice_no}
          </p>
          <p className="text-gray-600 text-sm">
            {title} Date: {(record?.date && getDate(record?.date)) || "-"}
          </p>
        </div>
        <Image
          src="/assets/logo/shortLogo.png"
          alt="Company Logo"
          className="h-16 w-16"
          width={50}
          height={50}
        />
      </div>

      {/* Record Info */}
      <div className="grid grid-cols-2 gap-4 border p-2 bg-gray-100">
        <div>
          <h3 className="font-semibold">Billing Address</h3>
          <p className="text-gray-600 text-sm">
            {record?.billing_street}
            <br />
            {`${record?.billing_code || ""} ${record?.billing_city || ""} ${
              record?.billing_state || ""
            } ${record?.billing_country || ""}`}
          </p>
        </div>
        <div>
          <h3 className="font-semibold">Shipping Address</h3>
          <p className="text-gray-600 text-sm">
            {record?.shipping_street}
            <br />
            {`${record?.shipping_code || ""} ${record?.shipping_city || ""} ${
              record?.shipping_state || ""
            } ${record?.shipping_country || ""}`}
          </p>
        </div>
      </div>

      {/* Item Table */}
      <table className="w-full border mt-6 text-sm">
        <thead className="bg-gray-800 text-white">
          <tr>
            <th className="p-2 text-center">#</th>
            <th className="p-2 text-left">Product/Service</th>
            <th className="p-2 text-center">Qty.</th>
            <th className="p-2 text-end">Price</th>
            <th className="p-2 text-end">Amount</th>
            <th className="p-2 text-end">Discount</th>
            <th className="p-2 text-end">Tax</th>
            <th className="p-2 text-end">Total</th>
          </tr>
        </thead>
        <tbody>
          {(Array.isArray(record?.items)
            ? record?.items
            : JSON.parse(record?.items || "[]")
          ).map((item, index) => (
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
          <div className="mt-4 text-sm">
            <div className="flex justify-between border-t p-2">
              <span>Sub Total:</span>
              <span>{record?.subtotal}</span>
            </div>
            <div className="flex justify-between border-t p-2">
              <span>Discount:</span>
              <span>{record?.discount}</span>
            </div>
            <div className="flex justify-between border-t p-2">
              <span>Tax:</span>
              <span>{record?.tax}</span>
            </div>
            <div className="flex justify-between border-t p-2 font-bold text-md">
              <span>Grand Total:</span>
              <span>{record?.grand_total}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes & Signature */}
      <div className="mt-6">
        <h3 className="font-semibold text-sm">Terms and Conditions</h3>
        <p className="text-gray-600 text-sm">{record?.terms_conditions}</p>
      </div>

      <div className="mt-6 flex justify-between">
        <p className="text-sm">
          For any inquiries, email us at{" "}
          <span className="font-bold">{record?.company?.email}</span>
        </p>
        <div className="text-right">
          <p className="font-semibold text-sm">Authorized Signature</p>
          <Image
            src="/assets/images/signature.png"
            alt="Signature"
            className="h-16 w-16"
            width={100}
            height={100}
          />
        </div>
      </div>
    </div>
  );
});
Template.displayName = "Template";

const PrintTemplate = ({ record }) => {
  const componentRef = useRef();
  const [emailSent, setEmailSent] = useState(false);

  const handleDownloadPDF = useCallback(async () => {
    if (!componentRef.current) return;
    
    const element = componentRef.current;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const imgWidth = 210; 
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    pdf.save(`record_${record?.invoice_no}.pdf`);
  }, [record]);

  const handleSendEmail = () => {
    setEmailSent(true);
    alert("Email sent successfully!");
  };

  return (
    <>
      <div className="text-center">
        <button
          onClick={handleDownloadPDF}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg mt-4"
        >
          Download PDF
        </button>
        <button
          onClick={handleSendEmail}
          className="bg-green-500 text-white px-4 py-2 rounded-lg ml-2"
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

export default PrintTemplate;
