"use client";

import { GET } from "@/helper/ServerSideActions";
import { Logout } from "@/helper/ServerSideActions";
import useVendorStore from "@/stores/ecommerce/useVendorStore";
import { ecom_endpoints } from "@/utils/ecom_endpoints";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import toast from "react-hot-toast";

export default function SingelBannerCard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { vendor, setVendor } = useVendorStore();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await GET(
        ecom_endpoints.BANNER.GET_SINGLE_BANNER(vendor?.vendor_website_id)
      );
      if (res?.detail !== undefined) {
        toast.error(res.detail);
        setVendor({});
        Logout();
      }
      if (res?.status === 200) {
        setLoading(false);
        setData(res?.data);
      } else {
        setLoading(false);
        setError(res?.message || "Failed to fetch banner data");
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [vendor?.vendor_website_id]);

  return (
    <div className="container">
      {loading ? (
        <div className="border border-[#DDD] rounded-md overflow-hidden animate-pulse">
          <div className="flex flex-col justify-center items-center p-2 bg-gray-200 h-[20rem] rounded"></div>
        </div>
      ) : error ? (
        <div className="flex flex-col justify-center items-center p-2 bg-gray-200 h-[16.7rem] rounded display5 font-semibold">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
          {data?.map((product) => (
            <div
              key={product?.id}
              className="rounded-md overflow-hidden bg-gray-200 w-full relative"
            >
              <div className="bg-gray-300 h-[200px]">
                <Image
                  src={product?.banner_image}
                  alt="banner image"
                  width={200}
                  height={100}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="p-4 space-y-3 bg-gray-200">
                <div className="space-y-1 pb-12">
                  <p className="text-gray">
                    <span className="text-black font-semibold"> Title:</span>{" "}
                    {product?.image_title}
                  </p>
                  <p className="text-gray">
                    <span className="text-black font-semibold"> Position:</span>{" "}
                    {product?.position}
                  </p>
                  <p className="text-gray text-wrap overflow-hidden">
                    <span className="text-black font-semibold"> Url:</span>{" "}
                    {product?.target_url}
                  </p>
                </div>
                <div className="space-x-3 absolute bottom-1 left-0 w-full p-3">
                  <Link
                    href={ADMIN_PATHS?.BANNER?.SINGLE?.UPDATE(product?.id)}
                    className="block text-center font-semibold rounded-md px-3 py-[5px] bg-gray-800 text-white border border-gray-800 transition-all duration-300 hover:bg-transparent hover:text-gray-800"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
