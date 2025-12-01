"use client";

import PropTypes from "prop-types";
import { useFormContext, Controller } from "react-hook-form";

// ----------------------------------------------------------------------

SwitchControl.propTypes = {
    name: PropTypes.string.isRequired,
    title: PropTypes.string,
};

export default function SwitchControl({ name, title, defaultValue, ...other }) {
    const { control } = useFormContext();

    return (
        <Controller
            name={name}
            control={control}
            defaultValue={defaultValue}
            render={({ field, fieldState: { error } }) => (
                <div>
                    <label className="relative inline-flex cursor-pointer items-center">
                        <input
                            id="switch"
                            type="checkbox"
                            name={name}
                            className="peer sr-only"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked ? 1 : 0)}
                            {...other}
                        />
                        <label htmlFor="switch" className="hidden"></label>
                        <div className="peer h-6 w-11 rounded-full border bg-slate-200 after:absolute after:left-[2px] after:top-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-success peer-checked:after:translate-x-full peer-checked:after:border-white !peer-focus:ring-green-300"></div>
                    </label>
                    {error?.message && (
                        <p className="text-xs font-normal text-red-500">{error?.message}</p>
                    )}
                </div>
            )}
        />
    );
}