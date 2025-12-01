export function calculatePercentageChange(data) {

  if (!data || data.length < 2) {
    return { change: "0", isPositive: null };
  }

  const first = data[0].value;
  const last = data[data.length - 1].value;

  if (first === 0) {
    return { change: "0", isPositive: null };
  }
  const percentage = ((last - first) / first) * 100;
  const sign = percentage > 0 ? "+" : percentage < 0 ? "-" : "";
  const isPositive = percentage > 0 ? true : percentage < 0 ? false : null;
  return {
    change: `${sign}${Math.abs(percentage).toFixed(2)}%`,
    isPositive,
  };
}
