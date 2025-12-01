import { Icon } from "@iconify/react";
import React from "react";
const Button = ({
  children,
  loading,
  variant,
  direction,
  className,
  onClick,
  disabled,
  ...other
}) => {
  return (

   // border-color-[#7cdae4] hover:text-dark hover:bg-[#7cdae4]

    <button
      disabled={loading || disabled}
      className={`displayAnchor px-4 py-2 font-[500] rounded-md ${
        variant === "nextButton"
          ? "border bg-white text-gray-dark border-[#7cdae4] hover:text-white hover:bg-[#7cdae4] flex items-center justify-center gap-3 !font-bold"
          : variant === "previousButton"
          ? "text-gray font-semibold flex items-center justify-center gap-3"
          : variant === "gray"
          ? "bg-gray-light text-gray-dark border border-gray hover:bg-[white] font-bold"
          : variant === "primary"
          ? "bg-[#7cdae4] text-white font-bold border border-[#7cdae4] hover:bg-[white] hover:text-gray-dark"
          : variant === "danger"
          ? "bg-red-500 text-white font-bold border border-red-500 hover:bg-red-200 hover:text-red-500"
          : ""
      } transition-all duration-500 ${className}`}
      onClick={onClick}
      {...other}
    >
      {loading ? (
        <Icon
          icon="eos-icons:bubble-loading"
          width="1.5rem"
          height="1.5rem"
          className="mx-auto"
        />
      ) : (
        children
      )}
    </button>
  );
};
export default Button;
