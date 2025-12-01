"""
Global File Handler Utility for Next.js File Uploads
Handles thumbnails, images, and documents with proper error handling and logging
"""

import json
from typing import List, Dict, Any, Optional, Tuple
import re
from fastapi import UploadFile
from app.helpers.uploadimage import UploadImage
from app.utils import config


class FileHandler:
    """
    Global file handler for processing Next.js file uploads
    Supports both new file uploads and existing file preservation
    """
    
    @staticmethod
    def process_file_array(
        form_data: Any,
        field_name: str,
        upload_path: str,
        max_files: int = 10,
        allowed_extensions: Optional[List[str]] = None
    ) -> Tuple[List[str], List[str]]:
        """
        Process an array of files from Next.js FormData
        
        Args:
            form_data: FastAPI form data object
            field_name: Field name (e.g., 'thumbnails', 'images')
            upload_path: Upload path for the files
            max_files: Maximum number of files allowed
            allowed_extensions: List of allowed file extensions
            
        Returns:
            Tuple of (new_file_urls, old_file_urls)
        """
        new_file_urls = []
        old_file_urls = []
        
        try:
            # Get new files using getlist (Next.js FormData approach)
            new_files = form_data.getlist(field_name) if hasattr(form_data, 'getlist') else []

            # Also support quantity-driven and indexed fields like images_qty + images-0, images_0, 0_images, 0-images
            try:
                keys_iterable = list(form_data.keys()) if hasattr(form_data, 'keys') else []
            except Exception:
                keys_iterable = []

            indexed_matches: List[Tuple[int, Any]] = []
            if keys_iterable:
                pattern_suffix_underscore = re.compile(rf"^{re.escape(field_name)}_(\d+)$")
                pattern_suffix_dash = re.compile(rf"^{re.escape(field_name)}-(\d+)$")
                pattern_prefix_underscore = re.compile(rf"^(\d+)_" + re.escape(field_name) + r"$")
                pattern_prefix_dash = re.compile(rf"^(\d+)-" + re.escape(field_name) + r"$")

                # 1) If qty exists, iterate deterministic range
                qty_value = None
                for qty_key in [f"{field_name}_qty", f"{field_name}-qty", f"{field_name}qty"]:
                    if qty_key in keys_iterable:
                        try:
                            qty_value = int(str(form_data.get(qty_key)))
                        except Exception:
                            qty_value = None
                        break
                if qty_value is not None and qty_value > 0:
                    for i in range(qty_value):
                        for candidate_key in [
                            f"{field_name}-{i}",
                            f"{field_name}_{i}",
                            f"{i}_{field_name}",
                            f"{i}-{field_name}",
                        ]:
                            if candidate_key in keys_iterable:
                                try:
                                    file_obj = form_data.get(candidate_key)
                                    if file_obj and hasattr(file_obj, 'filename') and file_obj.filename:
                                        indexed_matches.append((i, file_obj))
                                        break  # stop at first match for this index
                                except Exception:
                                    pass

                for key in keys_iterable:
                    # 2) Match field_name_0 and field_name-0 patterns
                    m = pattern_suffix_underscore.match(key) or pattern_suffix_dash.match(key)
                    if m and (qty_value is None):
                        try:
                            idx = int(m.group(1))
                            file_obj = form_data.get(key)
                            if file_obj and hasattr(file_obj, 'filename') and file_obj.filename:
                                indexed_matches.append((idx, file_obj))
                            continue
                        except Exception:
                            pass

                    # 3) Match 0_field_name and 0-field_name patterns
                    if (qty_value is None) and key.endswith(field_name):
                        # Try underscore-based prefix
                        if key[:-len(field_name)].rstrip('_').isdigit():
                            try:
                                idx_str = key[:-len(field_name)].rstrip('_')
                                idx = int(idx_str)
                                file_obj = form_data.get(key)
                                if file_obj and hasattr(file_obj, 'filename') and file_obj.filename:
                                    indexed_matches.append((idx, file_obj))
                                continue
                            except Exception:
                                pass
                        # Try dash-based prefix
                        if key[:-len(field_name)].rstrip('-').isdigit():
                            try:
                                idx_str = key[:-len(field_name)].rstrip('-')
                                idx = int(idx_str)
                                file_obj = form_data.get(key)
                                if file_obj and hasattr(file_obj, 'filename') and file_obj.filename:
                                    indexed_matches.append((idx, file_obj))
                            except Exception:
                                pass

            if indexed_matches:
                indexed_matches.sort(key=lambda t: t[0])
                indexed_files = [f for _, f in indexed_matches]
                # Merge, preserving order: existing new_files first, then indexed ones not already included
                existing_id_set = {id(f) for f in new_files}
                for f in indexed_files:
                    if id(f) not in existing_id_set:
                        new_files.append(f)
            
            if new_files:
                print(f"📁 Processing {len(new_files)} {field_name} files")
                
                # Limit files to max_files
                if len(new_files) > max_files:
                    print(f"⚠️  Limiting {field_name} to {max_files} files (received {len(new_files)})")
                    new_files = new_files[:max_files]
                
                for file in new_files:
                    if file and hasattr(file, 'filename') and file.filename:
                        # Validate file extension if specified
                        if allowed_extensions:
                            file_ext = file.filename.lower().split('.')[-1]
                            if file_ext not in allowed_extensions:
                                print(f"❌ Skipping {file.filename} - invalid extension: {file_ext}")
                                continue
                        
                        try:
                            new_file_name = UploadImage.uploadImage_DO(file, upload_path)
                            file_url = config.IMAGE_DO_URL + new_file_name
                            new_file_urls.append(file_url)
                            print(f"✅ Uploaded {field_name}: {file.filename} -> {new_file_name}")
                        except Exception as e:
                            print(f"❌ Error uploading {field_name} {file.filename}: {e}")
                    else:
                        print(f"⚠️  Invalid {field_name} file: {file}")
            
            # Handle old files from existing records
            old_files_field = f"old_{field_name}"
            old_files_data = form_data.get(old_files_field, "")
            
            if old_files_data:
                old_file_urls = FileHandler._parse_existing_files(old_files_data, field_name)
            
            print(f"📊 {field_name} Summary: {len(new_file_urls)} new, {len(old_file_urls)} existing")
            
        except Exception as e:
            print(f"❌ Error processing {field_name}: {e}")
        
        return new_file_urls, old_file_urls
    
    @staticmethod
    def process_single_file(
        form_data: Any,
        field_name: str,
        upload_path: str,
        old_field_name: Optional[str] = None,
        allowed_extensions: Optional[List[str]] = None
    ) -> str:
        """
        Process a single file upload
        
        Args:
            form_data: FastAPI form data object
            field_name: Field name for new file
            upload_path: Upload path for the file
            old_field_name: Field name for old file (defaults to f"old_{field_name}")
            allowed_extensions: List of allowed file extensions
            
        Returns:
            File URL string
        """
        try:
            # Get new file
            new_file = form_data.get(field_name)
            # Also support indexed naming like registration_document_0 or 0_registration_document
            if (not new_file or not getattr(new_file, 'filename', None)) and hasattr(form_data, 'keys'):
                try:
                    keys_iterable = list(form_data.keys())
                except Exception:
                    keys_iterable = []

                candidates: List[Tuple[int, Any]] = []
                if keys_iterable:
                    # field_name_0 pattern
                    pattern_suffix = re.compile(rf"^{re.escape(field_name)}_(\d+)$")
                    for key in keys_iterable:
                        m = pattern_suffix.match(key)
                        if m:
                            try:
                                idx = int(m.group(1))
                                file_obj = form_data.get(key)
                                if file_obj and hasattr(file_obj, 'filename') and file_obj.filename:
                                    candidates.append((idx, file_obj))
                            except Exception:
                                pass
                    # 0_field_name pattern
                    for key in keys_iterable:
                        if key.endswith(field_name) and key[:-len(field_name)].rstrip('_').isdigit():
                            try:
                                idx_str = key[:-len(field_name)].rstrip('_')
                                idx = int(idx_str)
                                file_obj = form_data.get(key)
                                if file_obj and hasattr(file_obj, 'filename') and file_obj.filename:
                                    candidates.append((idx, file_obj))
                            except Exception:
                                pass

                if candidates:
                    candidates.sort(key=lambda t: t[0])
                    new_file = candidates[0][1]
            if new_file and hasattr(new_file, 'filename') and new_file.filename:
                # Validate file extension if specified
                if allowed_extensions:
                    file_ext = new_file.filename.lower().split('.')[-1]
                    if file_ext not in allowed_extensions:
                        print(f"❌ Invalid file extension for {new_file.filename}: {file_ext}")
                        return ""
                
                try:
                    new_file_name = UploadImage.uploadImage_DO(new_file, upload_path)
                    file_url = config.IMAGE_DO_URL + new_file_name
                    print(f"✅ Uploaded {field_name}: {new_file.filename} -> {new_file_name}")
                    return file_url
                except Exception as e:
                    print(f"❌ Error uploading {field_name}: {e}")
                    return ""
            
            # Handle old file
            old_field = old_field_name or f"old_{field_name}"
            old_file = form_data.get(old_field, "")
            if old_file:
                print(f"🔄 Using existing {field_name}: {old_file}")
                return old_file
            
            return ""
            
        except Exception as e:
            print(f"❌ Error processing {field_name}: {e}")
            return ""
    
    @staticmethod
    def _parse_existing_files(file_data: str, field_name: str) -> List[str]:
        """
        Parse existing file data (JSON string or plain string)
        
        Args:
            file_data: File data string (JSON array or plain string)
            field_name: Field name for logging
            
        Returns:
            List of file URLs
        """
        try:
            if not file_data:
                return []
            
            # Try to parse as JSON array
            if file_data.startswith('[') and file_data.endswith(']'):
                parsed_files = json.loads(file_data)
                if isinstance(parsed_files, list):
                    print(f"🔄 Parsed existing {field_name}: {len(parsed_files)} files")
                    return parsed_files
            
            # If not JSON array, treat as single file
            print(f"🔄 Using existing {field_name} (single): {file_data}")
            return [file_data] if file_data else []
            
        except (json.JSONDecodeError, ValueError) as e:
            print(f"⚠️  Error parsing existing {field_name}: {e}")
            return [file_data] if file_data else []
    
    @staticmethod
    def get_main_and_additional_files(
        all_files: List[str],
        field_name: str
    ) -> Tuple[str, List[str]]:
        """
        Split files into main file and additional files
        
        Args:
            all_files: List of all file URLs
            field_name: Field name for logging
            
        Returns:
            Tuple of (main_file_url, additional_file_urls)
        """
        if not all_files:
            return "", []
        
        main_file = all_files[0]
        additional_files = all_files[1:] if len(all_files) > 1 else []
        
        if additional_files:
            print(f"📸 {field_name}: 1 main + {len(additional_files)} additional")
        else:
            print(f"📸 {field_name}: 1 file")
        
        return main_file, additional_files
    
    @staticmethod
    def validate_file_extensions(
        filename: str,
        allowed_extensions: List[str]
    ) -> bool:
        """
        Validate file extension
        
        Args:
            filename: File name to validate
            allowed_extensions: List of allowed extensions
            
        Returns:
            True if valid, False otherwise
        """
        if not filename or not allowed_extensions:
            return True
        
        file_ext = filename.lower().split('.')[-1]
        return file_ext in allowed_extensions
    
    @staticmethod
    def get_file_info(files: List[str], field_name: str) -> Dict[str, Any]:
        """
        Get file information summary
        
        Args:
            files: List of file URLs
            field_name: Field name
            
        Returns:
            Dictionary with file information
        """
        return {
            "count": len(files),
            "urls": files,
            "main_file": files[0] if files else "",
            "additional_files": files[1:] if len(files) > 1 else [],
            "field_name": field_name
        }


# Convenience functions for common use cases
def process_thumbnails(form_data: Any, old_thumbnails: str = "") -> Tuple[str, List[str]]:
    """
    Process thumbnail files for vehicles
    
    Returns:
        Tuple of (main_thumbnail_url, additional_thumbnail_urls)
    """
    new_files, old_files = FileHandler.process_file_array(
        form_data, 
        "thumbnails", 
        "rentify/vehicles/thumbnails",
        max_files=5,
        allowed_extensions=["jpg", "jpeg", "png", "webp"]
    )
    
    # Combine new and old files
    all_files = new_files + old_files
    
    return FileHandler.get_main_and_additional_files(all_files, "thumbnails")


def process_images(form_data: Any, old_images: str = "") -> List[str]:
    """
    Process image files for vehicles
    
    Returns:
        List of image URLs
    """
    new_files, old_files = FileHandler.process_file_array(
        form_data, 
        "images", 
        "rentify/vehicles/images",
        max_files=20,
        allowed_extensions=["jpg", "jpeg", "png", "webp", "gif"]
    )
    
    # Combine new and old files
    return new_files + old_files


def process_document(
    form_data: Any, 
    field_name: str, 
    upload_path: str,
    old_field_name: Optional[str] = None
) -> str:
    """
    Process a single document file
    
    Returns:
        Document URL string
    """
    return FileHandler.process_single_file(
        form_data,
        field_name,
        upload_path,
        old_field_name,
        allowed_extensions=["pdf", "doc", "docx", "jpg", "jpeg", "png"]
    )
