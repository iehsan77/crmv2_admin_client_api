export default function FinancialStats({ data }) {
  if (!data?.financial_values) return null; // safeguard

  return (
    <div className="mt-6">
      <h3 className="text-primary underline underline-offset-3 text-base mb-2 font-medium">
        Financial Value
      </h3>
      <div className="flex gap-4 flex-wrap">
        {Object.entries(data.financial_values).map(([key, value]) => (
          <div key={key} className="mr-8">
            <p className="text-sm text-muted-foreground capitalize">
              {key
                .replace(/_/g, " ") // underscores → space
                .replace(/([A-Z])/g, " $1") // insert space before uppercase
                .trim()}
            </p>
            <p className="font-medium">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
