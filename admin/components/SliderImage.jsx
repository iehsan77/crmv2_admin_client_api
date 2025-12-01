"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";

const SliderImage = (product) => {
  return (
    <div className="overflow-hidden rounded-md">
      <div className="bg-gray-300 h-[200px]">
        <Image
          src={product?.image}
          alt={product?.image_title}
          width={200}
          height={100}
          className="h-full w-full object-contain"
        />
      </div>
      <div className="p-4 space-y-3 bg-gray-200 ">
        <div className="space-y-1">
          <p className="text-gray">
            <span className="text-black font-semibold"> Title:</span>{" "}
            {product?.image_title}
          </p>
          <p className="text-gray">
            <span className="text-black font-semibold"> Position:</span>{" "}
            {product?.position}
          </p>
          <p className="text-gray">
            <span className="text-black font-semibold"> Url:</span>{" "}
            {product?.target_url}
          </p>
        </div>
        <div className="space-x-3">
          <Link
            href={ADMIN_PATHS.BANNER.MULTIPLE.UPDATE(product?.id)}
            className="block text-center font-semibold rounded-md px-3 py-[5px] bg-gray-800 text-white border border-gray-800 transition-all duration-300 hover:bg-transparent hover:text-gray-800"
          >
            Edit
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SliderImage;
