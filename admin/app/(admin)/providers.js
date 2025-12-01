import React from "react";
import { FormDataProvider } from "./form-builder/context/FormDataContext";

const Providers = ({ children }) => {
  return <FormDataProvider>{children}</FormDataProvider>;
};

export default Providers;
