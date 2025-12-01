"use client";

import { Logout } from "@/helper/ServerSideActions";

import toast from "react-hot-toast";

export const handleResponse = (response) => {
  if (!response || typeof response !== "object") {
    toast.error("No response received from API.");
    return false;
  }

  const { status, message } = response;

  if (response?.detail) {
    toast.error(message || "Your session has expired.");
    Logout();
  }

  switch (status) {
    case 200:
    case 201:
      return true;
    case 403:
      toast.error(message || "Your session has expired.");
      Logout();
      return false;
    default:
      toast.error(message || "Something went wrong.");
      return false;
  }
};
