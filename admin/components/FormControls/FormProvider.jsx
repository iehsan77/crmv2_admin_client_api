"use client";

import PropTypes from "prop-types";
// form
import { FormProvider as FORM } from "react-hook-form";

// ----------------------------------------------------------------------

FormProvider.propTypes = {
  children: PropTypes.node,
  methods: PropTypes.object,
  onSubmit: PropTypes.func,
};

export default function FormProvider({
  children,
  onSubmit,
  methods,
  className,
}) {
  return (
    <FORM {...methods}>
      <form onSubmit={onSubmit} className={`space-y-4 ${className}`}>
        {children}
      </form>
    </FORM>
  );
}
