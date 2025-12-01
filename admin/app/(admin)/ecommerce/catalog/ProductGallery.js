"use client";
import React, { useEffect, useState } from "react";
//import { useRouter } from "next/navigation";
import FormProvider from "@/components/FormControls/FormProvider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useParams } from "next/navigation";
import { z } from "zod";

import Image from "next/image";
import { toast } from "sonner";
import { ecom_endpoints } from "@/utils/ecom_endpoints";

import {handleResponse} from "@/helper/ClientSideActions";
import { GET, POST, POST_JSON, fetchToken } from "@/helper/ServerSideActions";

import FilesUpload from "@/components/FormControls/FilesUpload";

import { Button } from "@/components/ui/button";

const ProductGallery = () => {

  // PAGE RELATED - starting
  const params = useParams(); // ✅ Get route params
  const productId = params.id;

  //const router = useRouter();
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const listUrl = ecom_endpoints?.products?.gallery?.list;
  const addRecordUrl = ecom_endpoints?.products?.gallery?.create;
  const deleteImage = ecom_endpoints?.products?.gallery?.deleteImage;
  // PAGE RELATED - ending

  // FETCH LISTING DATA - starting
  useEffect(() => {
    (async () => {
      try {
        setGalleryLoading(true)
        // FECTHING CATEGORIES
        const response = await POST(listUrl, {
          product_id: productId,
          showAll: true,
        });
        setGalleryLoading(false)
        if (response?.status === 200) {
          setGalleryImages(response.data);
        }
      } catch (error) {
        console.error("Error fetching product records:", error);
      }
    })();
  }, [productId, listUrl]);
  // FETCH LISTING DATA - ending

  // FORM METHODS - starting
  const formSchema = z.object({
    images: z
      .array(z.union([z.instanceof(File), z.string()])) // ✅ Expect an array
      .nonempty({ message: "Please select at least one product image" }),
  });
  const methods = useForm({
    resolver: zodResolver(formSchema),
  });
  const {
    handleSubmit,
    setValue,
    formState: { isSubmitting, errors },
  } = methods;
  // FORM METHODS - ending

  // FORM SUBMISSIONS - starting
  const onSubmit = async (formData) => {
    try {
      const { images, ...restFormData } = formData || {}; // Exclude images
      const body = {
        ...restFormData,
        image_qty: images?.length || 0,
        product_id: productId,
        ...(images || []).reduce((acc, img, index) => {
          acc[`images_${index}`] = img;
          return acc;
        }, {}),
      };
      const response = await POST(addRecordUrl, body);
      if (response?.status === 200 || response?.status === 201) {
        setGalleryImages(response?.data);
        toast.success(response?.message);
      } else {
        handleResponse(response);
      }
      setValue('images',[])
    } catch (error) {
      console.log(error);
    }
  };
  // FORM SUBMISSIONS - ending

  const removeImage = (index, id) => {

    const response = GET(deleteImage + "/" + id);
    setGalleryImages(galleryImages.filter((_, i) => i !== index));
    toast.success("Gallery image deleted");
    
    /*
    if (response?.status === 200) {
      toast.success("Gallery image deleted");
    } else {
      toast.error(response?.message);
    }
    */
  };
  return (
    <>
      <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
        <div className="container !p-0">
          <div className="grid lg:grid-cols-8 gap-4 ">
            <div className="bg-[white] shadow-xl p-5 border rounded-sm col-span-8 ">
              <h4 className="font-semibold">Upload Gallery Images</h4>
              <FilesUpload name="images" />

              <div className="mt-3 border-t border-gray-300 pt-3">
                <Button
                  variant="primary"
                  disabled={isSubmitting}
                  onClick={handleSubmit((data) => onSubmit(data))}
                >
                  {isSubmitting ? "Loading..." : "Upload"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </FormProvider>
      <div className="container !p-0 mt-5">
        {galleryImages.length ? (
          <div>
            {galleryLoading ? (
              <div>Loading</div>
            ) : (

              <div className="bg-white shadow-xl p-5 border rounded-sm col-span-8 ">
                {/* Gallery Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-8 gap-4">
                  {galleryImages.map((img, index) => (
                    <div key={index} className="relative w-full h-full group">
                      <Image
                        src={img?.image_url}
                        alt={`Image ${index}`}
                        width={300} // Ensures high resolution
                        height={250} // Ensures high resolution
                        className="object-contain w-full h-full"
                      />
                      <button
                        className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition"
                        onClick={() => removeImage(index, img?.id)}
                      >
                        ✖
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            
            )}
          </div>
        ) : (
          <div className="bg-white shadow-xl p-5 border rounded-sm col-span-8 text-red-500">
            No images foud yet
          </div>
        )}
      </div>
    </>
  );
};

export default ProductGallery;
