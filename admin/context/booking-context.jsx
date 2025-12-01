"use client";
import CardPaymentForm from "@/partials/bookings/PaymentForm/CardPaymentForm";
import CashPaymentForm from "@/partials/bookings/PaymentForm/CashPaymentForm";
import { createContext, useContext, useEffect, useState } from "react";
import { useDrawer } from "./drawer-context";

const BookingContext = createContext();

export const BookingProvider = ({ children }) => {
  const [bookingResponse, setBookingResponse] = useState({});

  const { showDrawer } = useDrawer();

  const showCashForm = () => {
    showDrawer({
      title: "POS Payment",
      size: "xl",
      content: <CashPaymentForm record={bookingResponse?.data} />,
    });
  };
  const showPaymentForm = () => {
    showDrawer({
      title: "Payment",
      size: "xl",
      content: <CardPaymentForm record={bookingResponse?.data} />,
    });
  };

  useEffect(() => {
    if (Number(bookingResponse?.data?.payment_method_id) === 1) {
      showCashForm();
    }
    if (Number(bookingResponse?.data?.payment_method_id) === 2) {
      showPaymentForm();
    }
  }, [bookingResponse]);

  return (
    <BookingContext.Provider value={{ bookingResponse, setBookingResponse }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => useContext(BookingContext);
