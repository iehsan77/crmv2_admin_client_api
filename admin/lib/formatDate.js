export function formatDate(isoDateString) {
  if (!isoDateString) return;
  const date = new Date(isoDateString);

  // Check if the date is valid
  if (isNaN(date?.getTime())) {
    // throw new Error("Invalid date string");
  }

  const options = { year: "numeric", month: "long", day: "numeric" };
  return date.toLocaleDateString("en-US", options);
}
