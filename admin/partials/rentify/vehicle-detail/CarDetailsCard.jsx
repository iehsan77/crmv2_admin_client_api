export default function CarDetailsCard({ data }) {
  return (
    <div>
      <h3 className="text-primary underline underline-offset-3 text-base mb-2 font-medium">
        Vehicle Description
      </h3>
      <p
        className="text-muted-foreground"
        dangerouslySetInnerHTML={{
          __html: data?.description ?? "No description available.",
        }}
      />
      <p
        className="text-muted-foreground text-right"
        dangerouslySetInnerHTML={{
          __html: data?.description_ar ?? "No Arabic description available.",
        }}
      />
    </div>
  );
}