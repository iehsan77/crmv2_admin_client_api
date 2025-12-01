"use client";

import LoadingSkeletonCard from "@/components/LoadingSkeletonCard";
import WidgetCard from "@/components/WidgetCard";

const WidgetSection = ({ data = [], loading, loadingCrdsQty=6 }) => {
  return (
    <>
      {loading
        ? Array(loadingCrdsQty)
            .fill(null)
            .map((_, index) => <LoadingSkeletonCard key={index} />)
        : data?.map((item, index) => <WidgetCard key={index} data={item} />)}
    </>
  );
};

export default WidgetSection;
