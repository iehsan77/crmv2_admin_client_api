import Image from "next/image";

export default function CarFeaturesCard({ data }) {
  return (
    <div className="mt-6">
      <h3 className="text-primary underline underline-offset-3 text-base mb-2 font-medium">
        Car Features
      </h3>
      <div className="flex flex-wrap gap-2">
        {data?.map((feature, i) => (
          <div
            key={i}
            className="flex items-center gap-2 text-gray-600 p-2 border rounded-md"
          >
            {feature?.icon ? (
              <Image
                src={feature?.icon}
                alt={feature?.title}
                width={20}
                height={20}
                className="object-contain"
              />
            ) : null}
            <span>{feature?.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}