export default function SubmitBtn({ label, isSubmitting, disabled }) {
  const isDisabled = isSubmitting || disabled;

  return (
    <button
      type="submit"
      className={`w-full py-2 rounded-md font-semibold transition duration-200 px-4 cursor-pointer 
        ${isDisabled ? "bg-blue-300 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"} 
        text-white`}
      disabled={isDisabled}
    >
      {isSubmitting ? "Loading..." : label || "Submit"}
    </button>
  );
}
