import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload file to Cloudinary
 * @param fileBuffer - File buffer from multer
 * @param originalFilename - Original filename
 * @returns Object containing URL and public ID
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  originalFilename: string
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    // Upload stream to Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'chat_app_uploads',
        resource_type: 'auto',
        // For images: max width 1920px, auto quality
        transformation: [
          { width: 1920, crop: 'limit' },
          { quality: 'auto' }
        ],
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(new Error('File upload failed'));
        } else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        } else {
          reject(new Error('Upload failed: no result'));
        }
      }
    );

    // Write buffer to upload stream
    uploadStream.end(fileBuffer);
  });
}

// Export configured cloudinary instance for other uses
export { cloudinary };
