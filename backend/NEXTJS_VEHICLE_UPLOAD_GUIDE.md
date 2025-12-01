# Next.js Vehicle File Upload Guide

## 🚀 Overview

This guide shows how to implement file uploads in Next.js for the vehicle save endpoint using the optimized backend file handler. The backend now uses a global file handler utility that properly processes Next.js FormData with array names.

## 📁 Backend File Handler

The backend now uses a centralized file handling system located at `app/helpers/file_handler.py` that provides:

- **Automatic file validation** (extensions, file limits)
- **Error handling** with detailed logging
- **Support for both new and existing files**
- **File array processing** for thumbnails and images
- **Single file processing** for documents

## 🔧 Next.js Implementation

### **1. Basic Form Component**

```typescript
// components/VehicleForm.tsx
import { useState, useRef } from 'react';

interface VehicleFormData {
  title: string;
  brand_id: number;
  model_id: number;
  variant_id: number;
  body_type_id: number;
  rent_price: number;
  seats: number;
  fuel_type_id: number;
  // ... other fields
}

export default function VehicleForm() {
  const [formData, setFormData] = useState<VehicleFormData>({
    title: '',
    brand_id: 0,
    model_id: 0,
    variant_id: 0,
    body_type_id: 0,
    rent_price: 0,
    seats: 0,
    fuel_type_id: 0,
    // ... initialize other fields
  });
  
  const [thumbnailFiles, setThumbnailFiles] = useState<File[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [oldThumbnails, setOldThumbnails] = useState<string[]>([]);
  const [oldImages, setOldImages] = useState<string[]>([]);
  
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // File handling functions
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setThumbnailFiles(Array.from(e.target.files));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImageFiles(Array.from(e.target.files));
    }
  };

  const removeThumbnail = (index: number) => {
    setThumbnailFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeOldThumbnail = (index: number) => {
    setOldThumbnails(prev => prev.filter((_, i) => i !== index));
  };

  const removeOldImage = (index: number) => {
    setOldImages(prev => prev.filter((_, i) => i !== index));
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const formDataToSend = new FormData();
      
      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          formDataToSend.append(key, String(value));
        }
      });
      
      // Add thumbnail files with array names (thumbnails[])
      thumbnailFiles.forEach((file) => {
        formDataToSend.append('thumbnails', file);
      });
      
      // Add image files with array names (images[])
      imageFiles.forEach((file) => {
        formDataToSend.append('images', file);
      });
      
      // Add old thumbnail URLs as JSON string
      if (oldThumbnails.length > 0) {
        formDataToSend.append('old_thumbnails', JSON.stringify(oldThumbnails));
      }
      
      // Add old image URLs as JSON string
      if (oldImages.length > 0) {
        formDataToSend.append('old_images', JSON.stringify(oldImages));
      }
      
      // Send request to backend
      const response = await fetch('/api/rentify/vehicles/save', {
        method: 'POST',
        body: formDataToSend,
        headers: {
          'Authorization': `Bearer ${token}`,
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
            required
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="brand_id" className="block text-sm font-medium text-gray-700">
            Brand *
          </label>
          <select
            id="brand_id"
            required
            value={formData.brand_id}
            onChange={(e) => setFormData(prev => ({ ...prev, brand_id: Number(e.target.value) }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">Select Brand</option>
            {/* Add brand options here */}
          </select>
        </div>
        
        {/* Add other form fields similarly */}
      </div>
      
      {/* Thumbnail upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Thumbnails *
        </label>
        <input
          ref={thumbnailInputRef}
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
                  <button
                    type="button"
                    onClick={() => removeThumbnail(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                  {index === 0 && (
                    <span className="absolute -top-2 -left-2 bg-green-500 text-white text-xs px-1 rounded">
                      Main
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Display existing thumbnails */}
        {oldThumbnails.length > 0 && (
          <div className="mt-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Existing thumbnails:</p>
            <div className="flex flex-wrap gap-2">
              {oldThumbnails.map((url, index) => (
                <div key={index} className="relative">
                  <img
                    src={url}
                    alt={`Existing thumbnail ${index + 1}`}
                    className="h-20 w-20 object-cover rounded border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeOldThumbnail(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                  {index === 0 && (
                    <span className="absolute -top-2 -left-2 bg-green-500 text-white text-xs px-1 rounded">
                      Main
                    </span>
                  )}
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
          ref={imageInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageChange}
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
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
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Display existing images */}
        {oldImages.length > 0 && (
          <div className="mt-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Existing images:</p>
            <div className="flex flex-wrap gap-2">
              {oldImages.map((url, index) => (
                <div key={index} className="relative">
                  <img
                    src={url}
                    alt={`Existing image ${index + 1}`}
                    className="h-20 w-20 object-cover rounded border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeOldImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Submit button */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => {/* Handle cancel */}}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
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

### **2. API Route Handler (Optional)**

```typescript
// pages/api/rentify/vehicles/save.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Forward the request to your FastAPI backend
    const response = await fetch(`${process.env.API_BASE_URL}/rentify/vehicles/save`, {
      method: 'POST',
      body: req.body, // FormData will be automatically handled
      headers: {
        'Authorization': req.headers.authorization || '',
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      res.status(200).json(data);
    } else {
      res.status(response.status).json(data);
    }
  } catch (error) {
    console.error('Error forwarding request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export const config = {
  api: {
    bodyParser: false, // Disable body parsing, let FormData handle it
  },
};
```

### **3. Custom Hook for File Management**

```typescript
// hooks/useFileUpload.ts
import { useState, useCallback } from 'react';

interface UseFileUploadProps {
  maxFiles?: number;
  allowedTypes?: string[];
}

export function useFileUpload({ maxFiles = 10, allowedTypes = ['image/*'] }: UseFileUploadProps = {}) {
  const [files, setFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<string[]>([]);

  const addFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return;

    const fileArray = Array.from(newFiles);
    
    // Validate file types
    const validFiles = fileArray.filter(file => {
      const isValidType = allowedTypes.some(type => {
        if (type === 'image/*') {
          return file.type.startsWith('image/');
        }
        return file.type === type;
      });
      
      if (!isValidType) {
        console.warn(`File ${file.name} has unsupported type: ${file.type}`);
      }
      
      return isValidType;
    });

    // Check file limit
    if (files.length + validFiles.length > maxFiles) {
      console.warn(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setFiles(prev => [...prev, ...validFiles]);
  }, [files, maxFiles, allowedTypes]);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const removeExistingFile = useCallback((index: number) => {
    setExistingFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  const setExistingFilesList = useCallback((urls: string[]) => {
    setExistingFiles(urls);
  }, []);

  return {
    files,
    existingFiles,
    addFiles,
    removeFile,
    removeExistingFile,
    clearFiles,
    setExistingFilesList,
    totalFiles: files.length + existingFiles.length,
  };
}
```

## 📋 FormData Structure

The backend expects the following FormData structure:

### **Files**
- `thumbnails[]` - Array of thumbnail files
- `images[]` - Array of image files
- `registration_document` - Single registration document file

### **Old Files (for editing)**
- `old_thumbnails` - JSON string of existing thumbnail URLs
- `old_images` - JSON string of existing image URLs
- `old_registration_document` - Existing registration document URL

### **Form Fields**
- `title`, `brand_id`, `model_id`, etc. - All vehicle form fields

## 🔍 Backend Processing

The backend now processes files using the global file handler:

1. **Thumbnails**: First file becomes main thumbnail, rest become additional thumbnails
2. **Images**: All files are stored as an array
3. **Documents**: Single file upload with validation
4. **File Limits**: Thumbnails (5), Images (20), Documents (1)
5. **Extensions**: Validates file types automatically

## ✅ Benefits of the New System

1. **Cleaner Code**: File handling logic is centralized
2. **Better Error Handling**: Comprehensive error logging and validation
3. **File Validation**: Automatic extension and size validation
4. **Reusable**: Can be used across different endpoints
5. **Maintainable**: Single place to update file handling logic
6. **Performance**: Optimized file processing with limits

## 🚨 Important Notes

1. **File Limits**: Respect the backend file limits (thumbnails: 5, images: 20)
2. **File Types**: Only upload supported file types
3. **FormData**: Use `formData.append('fieldname', file)` for arrays
4. **Old Files**: Pass existing files as JSON strings when editing
5. **Error Handling**: Always handle upload errors gracefully

## 🔧 Troubleshooting

### **Empty Arrays Issue**
- Ensure you're using `formData.append('thumbnails', file)` not `formData.append('thumbnails[]', file)`
- Check that files are actually selected before submission
- Verify file input has `multiple` attribute

### **File Upload Failures**
- Check file size limits
- Verify file extensions are supported
- Ensure proper upload paths are configured

### **FormData Issues**
- Don't set `Content-Type` header - let browser set it automatically
- Use `FormData` object, not plain object
- Ensure all files have valid filenames

This implementation provides a robust, maintainable solution for handling file uploads in Next.js with proper backend integration.
