import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads an image to Cloudinary.
 * @param file - The file to upload (as File or Buffer)
 * @param folder - The folder within Cloudinary to store the image
 * @returns Promise with the secure URL of the uploaded image
 */
export async function uploadImage(
  file: File | Buffer,
  folder: string = 'fly-crew'
): Promise<string> {
  try {
    // Convert File to Buffer if necessary
    const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      // Convert buffer to stream and pipe to uploadStream
      const stream = require('stream').Readable.from(buffer);
      stream.pipe(uploadStream);
    });

    // Return the secure URL
    return (result as { secure_url: string }).secure_url;
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw new Error('Failed to upload image');
  }
}

/**
 * Deletes an image from Cloudinary by its public ID.
 * @param publicId - The public ID of the image to delete
 * @returns Promise that resolves when the deletion is complete
 */
export async function deleteImage(publicId: string): Promise<void> {
  try {
    await new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
    });
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw new Error('Failed to delete image');
  }
}

/**
 * Extracts the public ID from a Cloudinary secure URL.
 * @param url - The Cloudinary secure URL
 * @returns The public ID (including folder) or null if not a Cloudinary URL
 */
export function getPublicIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname; // e.g., /fly-crew/image/upload/v1234567890/public_id.jpg
    // Remove leading slash and split by '/'
    const parts = pathname.slice(1).split('/');
    // Find the index of 'upload'
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;
    // The public ID is everything after 'upload/' (including version) but we want without version?
    // Actually, the public ID is the part after the version (if present) or after 'upload/'
    // We'll take everything after the version (if present) or after 'upload/' if no version.
    // However, the URL may have a version number (v1234567890) after 'upload/'
    // We want to remove the version to get the public ID.
    // Example: .../upload/v1234567890/fly-crew/image.jpg -> public ID: fly-crew/image
    // We'll remove the version segment if it starts with 'v' and is all numbers.
    const afterUpload = parts.slice(uploadIndex + 1);
    // If the first segment after upload is a version number (starts with v followed by digits), skip it
    const maybeVersion = afterUpload[0];
    const publicIdParts = /^v\d+$/.test(maybeVersion) ? afterUpload.slice(1) : afterUpload;
    // Join the remaining parts with '/' and remove the file extension
    const publicIdWithExt = publicIdParts.join('/');
    // Remove extension (everything after the last dot)
    const publicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.'));
    return publicId || null;
  } catch (error) {
    return null;
  }
}