"use client";

import { GET } from "@/helper/ServerSideActions";
import SliderImage from "@/components/SliderImage";
import SplideSlider from "@/components/SplideSlider";

import { Logout } from "@/helper/ServerSideActions";

import toast from "react-hot-toast";

import useVendorStore from "@/stores/ecommerce/useVendorStore";
import { ecom_endpoints } from "@/utils/ecom_endpoints";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function BannerSlider() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { vendor, setVendor } = useVendorStore();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await GET(
        ecom_endpoints.BANNER.GET_MULTI_BANNER(vendor?.vendor_website_id)
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

  const options = {
    type: "loop",
    perPage: 1,
    padding: "0.8rem",
    perMove: 1,
    pagination: false,
    gap: "15px",
    arrows: false,
    autoplay: true,
    autoScroll: {
      speed: 1,
    },
    mediaQuery: "min",
    breakpoints: {
      1024: { perPage: 2, arrows: true },
      1280: { perPage: 3, arrows: true },
    },
  };
  return (
    <div className=" container mx-auto_ space-y-5 bg-gray-200 p-3 rounded-md">
      <div className="flex items-center justify-between gap-3">
        <h3 className="display3 text-gray">Banner Slider</h3>
        <Link
          href={ADMIN_PATHS.BANNER.MULTIPLE.ADD}
          className="block text-center font-semibold rounded-md px-3 py-[5px] bg-gray-800 text-white border border-gray-800 transition-all duration-300 hover:bg-transparent hover:text-gray-800">
          Add Banner
        </Link>
      </div>
      {loading ? (
        <div className="border border-[#DDD] rounded-md overflow-hidden animate-pulse container mx-auto">
          <div className="flex flex-col justify-center items-center p-2 bg-gray-200 h-[22rem] rounded"></div>
        </div>
      ) : error ? (
        <div className="flex flex-col justify-center items-center p-2 bg-gray-200 h-[16.7rem] rounded display5 font-semibold">
          {error}
        </div>
      ) : (
        <div className="card-slide">
          <SplideSlider options={options} data={data}>
            <SliderImage />
          </SplideSlider>
        </div>
      )}
    </div>
  );
}
