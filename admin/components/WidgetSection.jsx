"use client";

import LoadingSkeletonCard from "@/components/LoadingSkeletonCard";
import WidgetCard from "@/components/WidgetCard";

const WidgetSection = ({ data = [], loading, loadingCrdsQty = 6 }) => {
  // Ensure data is an array
  const statisticsData = Array.isArray(data) ? data : [];

  return (
    <>
      {loading
        ? Array(loadingCrdsQty)
            .fill(null)
            .map((_, index) => <LoadingSkeletonCard key={index} />)
        : statisticsData.length > 0
        ? statisticsData.map((item, index) => (
            <WidgetCard key={item?.title || index} data={item} />
          ))
        : null}
    </>
  );
};

export default WidgetSection;
