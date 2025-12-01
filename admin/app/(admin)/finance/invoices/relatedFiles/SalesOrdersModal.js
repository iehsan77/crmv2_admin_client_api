"use client";
import React, { useState, useEffect } from "react";
import { GET } from "@/helper/ServerSideActions";

import { ecom_endpoints } from "@/utils/ecom_endpoints";

import {
  getDate,
  getFormatedNameEmail,
  convertToCurrency,
} from "@/helper/EcomActions";

export default function SalesOrdersModal({ setSalesOrdersModal, setSelectedSaleOrder }) {

  const [salesOrdersLoading, setSalesOrdersLoading] = useState(false);
  const [salesOrders, setSalesOrders] = useState([]);
  const [saleOrder, setSaleOrder] = useState(null);
  const [error, setError] = useState(false);
  const salesOrdersUrl = ecom_endpoints?.products?.salesOrders?.getRecords();

  // FETCH LISTING DATA - starting
  useEffect(() => {
    const fetchSalesOrders = async () => {
      setSalesOrders([]);
      setSalesOrdersLoading(true);
      try {
        const response = await GET(salesOrdersUrl);
        if (response?.status === 200) {
          setSalesOrders(response?.data);
        }
      } catch (error) {
        console.log(error);
      }
      setSalesOrdersLoading(false);
    };
    fetchSalesOrders();
  }, [salesOrdersUrl]);
  // FETCH LISTING DATA - ending

  const selectSaleOrder = () => {

    if (!saleOrder) {
      setError(true);
      return;
    } else {
      setError(false);
      setSalesOrdersModal(false);
      setSelectedSaleOrder(saleOrder)
    }
  };

  return (
    <>
      <div className="fixed inset-0 flex z-[9999] items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white w-[90%] p-6 rounded-lg shadow-lg">
          <h2 className="text-lg font-semibold mb-4">Select Sale Order</h2>
          <p>Please select sales order to load data into sales order</p>

          {/* Table */}
          <div className="max-h-80 overflow-auto border border-gray-200 rounded-md">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border"></th>
                  <th className="px-4 py-2 border">Sale Order #</th>
                  <th className="px-4 py-2 border">Sale Order Date</th>
                  <th className="px-4 py-2 border">Expiry Date</th>
                  <th className="px-4 py-2 border">Grand Total</th>
                  <th className="px-4 py-2 border">Customer</th>
                  <th className="px-4 py-2 border">Status</th>
                </tr>
              </thead>
              <tbody>
                {salesOrdersLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      Loading...
                    </td>
                  </tr>
                ) : salesOrders?.length > 0 ? (
                  salesOrders.map((q, i) => (
                    <tr key={i}>
                      <td>
                        <div className="p-2 text-center">
                          <input
                            name="selectedSaleOrder"
                            type="radio"
                            onClick={() => setSaleOrder(q)} // Ensure `q` is properly passed from map function
                          />
                        </div>
                      </td>
                      <td>{q.sale_order_no}</td>
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
              Please select sale order to import data into sales order.
            </div>
          )}

          {/* Buttons */}
          <div className="mt-4 flex justify-between">
            <button
              onClick={() => setSalesOrdersModal(false)}
              className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500"
            >
              Cancel
            </button>

            <button
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              onClick={() => selectSaleOrder()}
            >
              Load Data
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
