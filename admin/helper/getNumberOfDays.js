export default function getNumberOfDays(startDateISO, endDateISO) {
  const start = new Date(startDateISO);
  const end = new Date(endDateISO);

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const diffInMs = end.getTime() - start.getTime();
  const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

  return diffInMs <= 0 ? 1 : Math.ceil(diffInDays);
}
