"use client";
import { Splide, SplideSlide, SplideTrack } from "@splidejs/react-splide";
import "@splidejs/react-splide/css";
import React from "react";

const SplideSlider = ({
    children,
    data,
    ScrollingAuto,
    isGrid,
    options,
    scrollAndGrid,
}) => {
    return (
        <>
            <Splide
                options={options}
                aria-labelledby="autoplay-example-heading"
                hasTrack={false}
                extensions={
                    (ScrollingAuto && { AutoScroll }) ||
                    (isGrid && { Grid }) ||
                    (scrollAndGrid && { AutoScroll, Grid })
                }
            >
                <SplideTrack className="py-5">
                    {data?.map((item, index) => {
                        const childrenWithProps = React.Children.map(children, (child) => {
                            if (React.isValidElement(child)) {
                                const dataProps = item || {};
                                return React.cloneElement(child, {
                                    ...dataProps,
                                });
                            }
                            return child;
                        });
                        return (
                            <SplideSlide aria-roledescription="none" key={index}>
                                {childrenWithProps}
                            </SplideSlide>
                        );
                    })}
                </SplideTrack>
            </Splide>
        </>
    );
};

export default SplideSlider;
