import React from "react";

import { PageSubTitle } from "@/components/PageTitle";
import BannerSlider from "@/partials/banner/BannerSlider";
import SingelBannerCard from "@/partials/banner/SingelBannerCard";

export default function page() {
  return (
    <>
      <PageSubTitle title="Banner Management" />
      <div className="bg-white shadow-lg">
        <div className="p-6">
          <SingelBannerCard />
        </div>
        <div className="p-6">
          <BannerSlider />
        </div>
      </div>
    </>
  );
}
