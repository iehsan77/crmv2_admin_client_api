"use client";
import React, { useState, useEffect } from "react";
import { GET } from "@/helper/ServerSideActions";

import { ecom_endpoints } from "@/utils/ecom_endpoints";

import {
  getDate,
  getFormatedNameEmail,
  convertToCurrency,
} from "@/helper/EcomActions";

export default function QuotationsModal({ setQuotationsModal, setSelectedQuotation }) {
  
  const [quotationsLoading, setQuotationsLoading] = useState(false);
  const [quotations, setQuotations] = useState([]);
  const [quotation, setQuotation] = useState(null);
  const [error, setError] = useState(false);
  const quotationsUrl = ecom_endpoints?.products?.quotes?.getRecords();

  // FETCH LISTING DATA - starting
  useEffect(() => {
    const fetchQuotations = async () => {
      setQuotations([]);
      setQuotationsLoading(true);
      try {
        const response = await GET(quotationsUrl);
        if (response?.status === 200) {
          /*
          const formatedData = response?.data.map(({ id, quotation_no }) => ({
            value: String(id),
            label: String(quotation_no),
          }));
          */
          setQuotations(response?.data);
        }
      } catch (error) {
        console.log(error);
      }
      setQuotationsLoading(false);
    };
    fetchQuotations();
  }, [quotationsUrl]);
  // FETCH LISTING DATA - ending

  const selectQuotation = () => {

    if (!quotation) {
      setError(true);
      return;
    } else {
      setError(false);
      setQuotationsModal(false);
      setSelectedQuotation(quotation)
    }
  };

  return (
    <>
      <div className="fixed inset-0 flex z-[9999] items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white w-[90%] p-6 rounded-lg shadow-lg">
          <h2 className="text-lg font-semibold mb-4">Select Quotation</h2>
          <p>Please select quotation to load data into sales order</p>

          {/* Table */}
          <div className="max-h-80 overflow-auto border border-gray-200 rounded-md">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border"></th>
                  <th className="px-4 py-2 border">Quotation #</th>
                  <th className="px-4 py-2 border">Quotation Date</th>
                  <th className="px-4 py-2 border">Expiry Date</th>
                  <th className="px-4 py-2 border">Grand Total</th>
                  <th className="px-4 py-2 border">Customer</th>
                  <th className="px-4 py-2 border">Status</th>
                </tr>
              </thead>
              <tbody>
                {quotationsLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      Loading...
                    </td>
                  </tr>
                ) : quotations?.length > 0 ? (
                  quotations.map((q, i) => (
                    <tr key={i}>
                      <td>
                        <div className="p-2 text-center">
                          <input
                            name="selectedQuote"
                            type="radio"
                            onClick={() => setQuotation(q)} // Ensure `q` is properly passed from map function
                          />
                        </div>
                      </td>
                      <td>{q.quotation_no}</td>
                      <td>{q?.date ? getDate(q.date) : ""}</td>
                      <td>{q?.expiry_date ? getDate(q.expiry_date) : ""}</td>
                      <td>
                        {q?.grand_total ? convertToCurrency(q.grand_total) : ""}
                      </td>
                      <td>{getFormatedNameEmail(q?.customer_name)}</td>
                      <td>
                        {(() => {
                          try {
                            return q?.status ? JSON.parse(q.status)?.label : "";
                          } catch (error) {
                            console.error("Invalid JSON in status:", error);
                            return q?.status; // Return raw string if parsing fails
                          }
                        })()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center">
                      <div className="flex flex-col m-2 px-4 py-3 bg-red-50 border border-red-100 text-red-600 rounded-md">
                        🚨 Sorry! No records found.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {error && (
            <div className="flex flex-col px-4 py-3 mt-2 bg-red-50_ border_ border-red-100 text-red-600 rounded-md">
              Please select Quotation to import data into sales order.
            </div>
          )}

          {/* Buttons */}
          <div className="mt-4 flex justify-between">
            <button
              onClick={() => setQuotationsModal(false)}
              className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500"
            >
              Cancel
            </button>

            <button
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              onClick={() => selectQuotation()}
            >
              Load Data
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
