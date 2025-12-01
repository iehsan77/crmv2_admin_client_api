import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import Image from "next/image";

export default function ImageGallery({ images = [] }) {
  if (!images.length)
    return (
      <p className="text-sm text-muted-foreground">No images available.</p>
    );

  return (
    // <div className="overflow-x-auto">
      <ScrollArea className="max-w-[1560px] rounded-md ">
        <div className="flex gap-4">
          {images?.map((src, index) => (
            <div
              key={index}
              className="min-w-[160px] sm:min-w-[200px] md:min-w-[335px] aspect-[4/3] relative rounded border overflow-hidden bg-muted"
            >
              <Image
                src={src}
                alt={`Gallery Image ${index + 1}`}
                fill
                className="object-contain hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    // </div>
  );
}