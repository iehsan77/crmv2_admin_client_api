# Frontend FormData Troubleshooting Guide

## 🚨 **Critical Issue Identified**

Your frontend is sending FormData with **indexed field names** instead of **array names**, which is why files are not being saved.

### **❌ Current Problematic Payload:**
```
1_images: [object File],[object File],[object File],[object File],[object File]
1_thumbnails: [object File],[object File]
```

### **✅ Expected Correct Payload:**
```
images: [File1, File2, File3, File4, File5]
thumbnails: [File1, File2]
```

## 🔧 **Root Cause & Solution**

### **Problem 1: Indexed Field Names**
The frontend is creating field names like `1_images`, `1_thumbnails` instead of `images`, `thumbnails`.

### **Problem 2: Incorrect FormData Construction**
The FormData is not being built using the proper `append()` method for arrays.

## 🛠️ **Frontend Fixes**

### **1. Fix FormData Construction**

```typescript
// ❌ WRONG - What you're currently doing
const formData = new FormData();
formData.append('1_images', images);        // Creates indexed field
formData.append('1_thumbnails', thumbnails); // Creates indexed field

// ✅ CORRECT - Proper array handling
const formData = new FormData();

// Add form fields (NOT indexed)
formData.append('title', vehicleData.title);
formData.append('brand_id', vehicleData.brand_id.toString());
formData.append('model_id', vehicleData.model_id.toString());
// ... other fields

// Add files with array names
images.forEach((file) => {
  formData.append('images', file);  // Use 'images' not '1_images'
});

thumbnails.forEach((file) => {
  formData.append('thumbnails', file);  // Use 'thumbnails' not '1_thumbnails'
});

// Add old files as JSON strings
if (oldImages.length > 0) {
  formData.append('old_images', JSON.stringify(oldImages));
}

if (oldThumbnails.length > 0) {
  formData.append('old_thumbnails', JSON.stringify(oldThumbnails));
}
```

### **2. Complete Corrected Form Component (JavaScript)**

```javascript
// components/VehicleForm.jsx
import React, { useState, useRef } from 'react';

export default function VehicleForm() {
  // Form data state
  const [formData, setFormData] = useState({
    title: '',
    brand_id: '',
    model_id: '',
    variant_id: '',
    vehicle_condition: '',
    year: '',
    purchase_date: '',
    purchase_price: '',
    rent_price: '',
    transmission_type_id: '',
    body_type_id: '',
    top_speed: '',
    acceleration: '',
    seats: '',
    fuel_tank_range: '',
    fuel_type_id: '',
    exterior_color: '',
    interior_color: '',
    number_plate: '',
    fitness_renewal_date: '',
    horse_power: '',
    feature_ids: '',
    is_feature: '',
    insurer_name: '',
    insurance_issue_date: '',
    insurance_expiry_date: '',
    premium_payment: '',
    description: '',
    description_ar: '',
  });
  
  // File states
  const [thumbnailFiles, setThumbnailFiles] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [oldThumbnails, setOldThumbnails] = useState([]);
  const [oldImages, setOldImages] = useState([]);

  // Input change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // File change handlers
  const handleThumbnailChange = (e) => {
    if (e.target.files) {
      setThumbnailFiles(Array.from(e.target.files));
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files) {
      setImageFiles(Array.from(e.target.files));
    }
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // ✅ CORRECT: Create FormData properly
      const formDataToSend = new FormData();
      
      // Add form fields (NOT indexed)
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          formDataToSend.append(key, String(value));  // Use 'key' not '1_key'
        }
      });
      
      // Add thumbnail files with array names
      thumbnailFiles.forEach((file) => {
        formDataToSend.append('thumbnails', file);  // Use 'thumbnails' not '1_thumbnails'
      });
      
      // Add image files with array names
      imageFiles.forEach((file) => {
        formDataToSend.append('images', file);  // Use 'images' not '1_images'
      });
      
      // Add old files as JSON strings
      if (oldThumbnails.length > 0) {
        formDataToSend.append('old_thumbnails', JSON.stringify(oldThumbnails));
      }
      
      if (oldImages.length > 0) {
        formDataToSend.append('old_images', JSON.stringify(oldImages));
      }
      
      // Debug FormData before sending
      console.log('=== FormData Debug ===');
      for (let [key, value] of formDataToSend.entries()) {
        if (value instanceof File) {
          console.log(`${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }
      console.log('=== End Debug ===');
      
      // Send request
      const response = await fetch('/api/rentify/vehicles/save', {
        method: 'POST',
        body: formDataToSend,
        headers: {
          'Authorization': `Bearer ${token}`,
          // ❌ DON'T set Content-Type - let browser set it automatically
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Vehicle saved successfully:', result);
        // Handle success (redirect, show message, etc.)
      } else {
        const error = await response.json();
        console.error('Failed to save vehicle:', error);
        // Handle error
      }
    } catch (error) {
      console.error('Error saving vehicle:', error);
      // Handle error
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic form fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            value={formData.title}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="brand_id" className="block text-sm font-medium text-gray-700">
            Brand *
          </label>
          <input
            type="text"
            id="brand_id"
            name="brand_id"
            required
            value={formData.brand_id}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="model_id" className="block text-sm font-medium text-gray-700">
            Model ID *
          </label>
          <input
            type="text"
            id="model_id"
            name="model_id"
            required
            value={formData.model_id}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="variant_id" className="block text-sm font-medium text-gray-700">
            Variant ID *
          </label>
          <input
            type="text"
            id="variant_id"
            name="variant_id"
            required
            value={formData.variant_id}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="vehicle_condition" className="block text-sm font-medium text-gray-700">
            Vehicle Condition
          </label>
          <input
            type="text"
            id="vehicle_condition"
            name="vehicle_condition"
            value={formData.vehicle_condition}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="year" className="block text-sm font-medium text-gray-700">
            Year *
          </label>
          <input
            type="text"
            id="year"
            name="year"
            required
            value={formData.year}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="purchase_date" className="block text-sm font-medium text-gray-700">
            Purchase Date
          </label>
          <input
            type="datetime-local"
            id="purchase_date"
            name="purchase_date"
            value={formData.purchase_date}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="purchase_price" className="block text-sm font-medium text-gray-700">
            Purchase Price
          </label>
          <input
            type="number"
            id="purchase_price"
            name="purchase_price"
            value={formData.purchase_price}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="rent_price" className="block text-sm font-medium text-gray-700">
            Rent Price *
          </label>
          <input
            type="number"
            id="rent_price"
            name="rent_price"
            required
            value={formData.rent_price}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="transmission_type_id" className="block text-sm font-medium text-gray-700">
            Transmission Type ID
          </label>
          <input
            type="text"
            id="transmission_type_id"
            name="transmission_type_id"
            value={formData.transmission_type_id}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="body_type_id" className="block text-sm font-medium text-gray-700">
            Body Type ID *
          </label>
          <input
            type="text"
            id="body_type_id"
            name="body_type_id"
            required
            value={formData.body_type_id}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="top_speed" className="block text-sm font-medium text-gray-700">
            Top Speed
          </label>
          <input
            type="number"
            id="top_speed"
            name="top_speed"
            value={formData.top_speed}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="acceleration" className="block text-sm font-medium text-gray-700">
            Acceleration
          </label>
          <input
            type="number"
            id="acceleration"
            name="acceleration"
            value={formData.acceleration}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="seats" className="block text-sm font-medium text-gray-700">
            Seats *
          </label>
          <input
            type="number"
            id="seats"
            name="seats"
            required
            value={formData.seats}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="fuel_tank_range" className="block text-sm font-medium text-gray-700">
            Fuel Tank Range
          </label>
          <input
            type="number"
            id="fuel_tank_range"
            name="fuel_tank_range"
            value={formData.fuel_tank_range}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="fuel_type_id" className="block text-sm font-medium text-gray-700">
            Fuel Type ID *
          </label>
          <input
            type="text"
            id="fuel_type_id"
            name="fuel_type_id"
            required
            value={formData.fuel_type_id}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="mileage" className="block text-sm font-medium text-gray-700">
            Mileage Limit
          </label>
          <input
            type="number"
            id="mileage"
            name="mileage"
            value={formData.mileage}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="exterior_color" className="block text-sm font-medium text-gray-700">
            Exterior Color
          </label>
          <input
            type="text"
            id="exterior_color"
            name="exterior_color"
            value={formData.exterior_color}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="interior_color" className="block text-sm font-medium text-gray-700">
            Interior Color
          </label>
          <input
            type="text"
            id="interior_color"
            name="interior_color"
            value={formData.interior_color}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="number_plate" className="block text-sm font-medium text-gray-700">
            Number Plate
          </label>
          <input
            type="text"
            id="number_plate"
            name="number_plate"
            value={formData.number_plate}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="fitness_renewal_date" className="block text-sm font-medium text-gray-700">
            Fitness Renewal Date
          </label>
          <input
            type="datetime-local"
            id="fitness_renewal_date"
            name="fitness_renewal_date"
            value={formData.fitness_renewal_date}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="horse_power" className="block text-sm font-medium text-gray-700">
            Horse Power
          </label>
          <input
            type="number"
            id="horse_power"
            name="horse_power"
            value={formData.horse_power}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="feature_ids" className="block text-sm font-medium text-gray-700">
            Feature IDs
          </label>
          <input
            type="text"
            id="feature_ids"
            name="feature_ids"
            value={formData.feature_ids}
            onChange={handleInputChange}
            placeholder="11,10,8,7"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="is_feature" className="block text-sm font-medium text-gray-700">
            Is Feature
          </label>
          <select
            id="is_feature"
            name="is_feature"
            value={formData.is_feature}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">Select</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="insurer_name" className="block text-sm font-medium text-gray-700">
            Insurer Name
          </label>
          <input
            type="text"
            id="insurer_name"
            name="insurer_name"
            value={formData.insurer_name}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="insurance_issue_date" className="block text-sm font-medium text-gray-700">
            Insurance Issue Date
          </label>
          <input
            type="datetime-local"
            id="insurance_issue_date"
            name="insurance_issue_date"
            value={formData.insurance_issue_date}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="insurance_expiry_date" className="block text-sm font-medium text-gray-700">
            Insurance Expiry Date
          </label>
          <input
            type="datetime-local"
            id="insurance_expiry_date"
            name="insurance_expiry_date"
            value={formData.insurance_expiry_date}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="premium_payment" className="block text-sm font-medium text-gray-700">
            Premium Payment
          </label>
          <input
            type="number"
            id="premium_payment"
            name="premium_payment"
            value={formData.premium_payment}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>
      
      {/* Description fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="<p>Vehicle description</p>"
          />
        </div>
        
        <div>
          <label htmlFor="description_ar" className="block text-sm font-medium text-gray-700">
            Description (Arabic)
          </label>
          <textarea
            id="description_ar"
            name="description_ar"
            rows={4}
            value={formData.description_ar}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="<p>وصف السيارة</p>"
          />
        </div>
      </div>
      
      {/* Thumbnail upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Thumbnails *
        </label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleThumbnailChange}
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        />
        <p className="mt-1 text-sm text-gray-500">
          First image will be used as main thumbnail. Max 5 files. Supported: JPG, PNG, WebP
        </p>
        
        {/* Display selected thumbnails */}
        {thumbnailFiles.length > 0 && (
          <div className="mt-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Selected thumbnails:</p>
            <div className="flex flex-wrap gap-2">
              {thumbnailFiles.map((file, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Thumbnail ${index + 1}`}
                    className="h-20 w-20 object-cover rounded border-2 border-gray-200"
                  />
                  <span className="absolute -top-2 -left-2 bg-green-500 text-white text-xs px-1 rounded">
                    {index === 0 ? 'Main' : `${index + 1}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Image upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Images
        </label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        <p className="mt-1 text-sm text-gray-500">
          Additional vehicle images. Max 20 files. Supported: JPG, PNG, WebP, GIF
        </p>
        
        {/* Display selected images */}
        {imageFiles.length > 0 && (
          <div className="mt-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Selected images:</p>
            <div className="flex flex-wrap gap-2">
              {imageFiles.map((file, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Image ${index + 1}`}
                    className="h-20 w-20 object-cover rounded border-2 border-gray-200"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Submit button */}
      <div className="flex justify-end space-x-3">
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Save Vehicle
        </button>
      </div>
    </form>
  );
}
```

## 🚨 **Common Mistakes to Avoid**

### **1. Don't Use Indexed Field Names**
```typescript
// ❌ WRONG
formData.append('1_images', images);
formData.append('1_thumbnails', thumbnails);

// ✅ CORRECT
images.forEach(file => formData.append('images', file));
thumbnails.forEach(file => formData.append('thumbnails', file));
```

### **2. Don't Set Content-Type Header**
```typescript
// ❌ WRONG
headers: {
  'Content-Type': 'multipart/form-data',  // Browser will set this automatically
  'Authorization': `Bearer ${token}`,
}

// ✅ CORRECT
headers: {
  'Authorization': `Bearer ${token}`,
  // Let browser set Content-Type automatically
}
```

### **3. Don't Use Object Keys for FormData**
```typescript
// ❌ WRONG
const formData = {
  '1_images': images,
  '1_thumbnails': thumbnails,
};

// ✅ CORRECT
const formData = new FormData();
images.forEach(file => formData.append('images', file));
thumbnails.forEach(file => formData.append('thumbnails', file));
```

## 🔍 **Debugging Steps**

### **1. Check Console Output**
Look for the FormData debug output in your browser console:
```
=== FormData Debug ===
title: Vehicle 121
brand_id: Dacia
images: File(image1.jpg, 12345 bytes, image/jpeg)
images: File(image2.jpg, 23456 bytes, image/jpeg)
thumbnails: File(thumb1.jpg, 5678 bytes, image/jpeg)
=== End Debug ===
```

### **2. Check Network Tab**
In browser DevTools → Network tab:
- Look for the request to `/rentify/vehicles/save`
- Check the request payload
- Verify files are being sent as `multipart/form-data`

### **3. Check Backend Logs**
The backend will now show detailed debug information:
```
🔍 === Form Data Debug ===
Form keys: ['title', 'brand_id', 'images', 'thumbnails', ...]
Form type: <class 'fastapi.datastructures.UploadFile'>
📸 Thumbnails found: 2
🖼️  Images found: 5
🔍 === End Debug ===
```

## ✅ **Expected Result**

After fixing the frontend, you should see:
1. **Files being uploaded successfully**
2. **Backend logs showing correct field names**
3. **Images and thumbnails saved to database**
4. **No more indexed field names in payload**

## 🆘 **Still Having Issues?**

If the problem persists after implementing these fixes:

1. **Check the FormData debug output** in browser console
2. **Verify the network request payload** in DevTools
3. **Check backend logs** for the debug information
4. **Ensure you're using the latest backend code** with debug logging

The issue is definitely in the frontend FormData construction, not the backend file handling logic.
