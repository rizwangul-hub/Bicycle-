const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configure Cloudinary if credentials are present
const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure:     true,
  });
}

class StorageService {
  /**
   * Upload file buffer to Cloudinary (or local fallback).
   *
   * @param {Buffer} buffer - File buffer
   * @param {Object} options - Metadata for organizing files
   * @param {string} options.shopCode - e.g. "STATION"
   * @param {string} options.declarationId - MongoDB declaration ObjectId string
   * @param {string} options.category - e.g. "BICYCLE"
   * @param {string} options.originalFileName - Original filename
   * @param {string} options.mimeType - File MIME type
   * @returns {Promise<{ storageUrl: string, storagePublicId: string }>}
   */
  async uploadFile(buffer, options) {
    const {
      shopCode = 'general',
      declarationId,
      category,
      originalFileName,
      mimeType,
    } = options;

    const isPdf = mimeType === 'application/pdf';
    const folderPath = `pixx-bicycle-declarations/${shopCode.toLowerCase()}/${declarationId}/${category.toLowerCase()}`;
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    const sanitizedBase = path.parse(originalFileName).name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const publicId = `${sanitizedBase}_${uniqueSuffix}`;

    if (isCloudinaryConfigured) {
      try {
        return await new Promise((resolve, reject) => {
          const uploadOptions = {
            folder: folderPath,
            public_id: publicId,
            resource_type: isPdf ? 'raw' : 'image',
            // Preserve evidence quality while optimizing delivery
            quality: isPdf ? undefined : 'auto:good',
            overwrite: false,
          };

          const uploadStream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
              if (error) return reject(error);
              resolve({
                storageUrl: result.secure_url,
                storagePublicId: result.public_id,
              });
            }
          );

          uploadStream.end(buffer);
        });
      } catch (cloudErr) {
        console.warn('Cloudinary upload warning:', cloudErr.message, '— utilizing local storage fallback');
      }
    }

    // ── Resilient Local Storage Fallback ──
    // Ensures zero-failure in offline development or CI testing
    const uploadsDir = path.join(__dirname, '../../uploads', folderPath);
    fs.mkdirSync(uploadsDir, { recursive: true });

    const ext = path.extname(originalFileName) || (isPdf ? '.pdf' : '.jpg');
    const diskFileName = `${publicId}${ext}`;
    const diskPath = path.join(uploadsDir, diskFileName);

    fs.writeFileSync(diskPath, buffer);

    const relativeUrl = `/uploads/${folderPath}/${diskFileName}`.replace(/\\/g, '/');

    return {
      storageUrl: relativeUrl,
      storagePublicId: `${folderPath}/${publicId}`,
    };
  }

  /**
   * Delete file from Cloudinary (or local fallback).
   *
   * @param {string} storagePublicId - Public ID in storage
   * @param {string} [mimeType] - MIME type to distinguish raw from image
   */
  async deleteFile(storagePublicId, mimeType) {
    if (isCloudinaryConfigured) {
      try {
        const isPdf = mimeType === 'application/pdf';
        await cloudinary.uploader.destroy(storagePublicId, {
          resource_type: isPdf ? 'raw' : 'image',
        });
        return;
      } catch (cloudErr) {
        console.warn('Cloudinary delete warning:', cloudErr.message);
      }
    }

    // Local fallback deletion
    try {
      const localPath = path.join(__dirname, '../../uploads', storagePublicId);
      // Try with common extensions
      const extensions = ['', '.jpg', '.jpeg', '.png', '.webp', '.pdf'];
      for (const ext of extensions) {
        const fullPath = localPath + ext;
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          break;
        }
      }
    } catch {
      // Ignored for safety
    }
  }
}

module.exports = new StorageService();
