/**
 * Client-Side Image Compression Utility
 * Prevents Vercel 4.5MB Serverless Payload Limits and network timeouts.
 * Converts heavy camera photos (HEIC/JPEG 5-15MB) into sharp, lightweight JPEGs (~300KB-800KB).
 */

export async function compressImageFile(file, maxWidth = 1920, maxHeight = 1920, quality = 0.85) {
  if (!file) return file;

  // Don't alter non-image documents (e.g. PDF)
  if (file.type && !file.type.startsWith('image/')) {
    return file;
  }

  // Already tiny image (< 300KB), return as is
  if (file.size && file.size < 300 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    try {
      const reader = new FileReader();

      reader.onload = (event) => {
        const img = new Image();

        img.onload = () => {
          let { width, height } = img;

          // Scale down maintaining aspect ratio
          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file);
                return;
              }

              // Preserve clean base name, normalize extension to .jpg
              const rawName = file.name || 'photo.jpg';
              const baseName = rawName.replace(/\.[^/.]+$/, '');
              const cleanFileName = `${baseName}.jpg`;

              const compressedFile = new File([blob], cleanFileName, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });

              resolve(compressedFile);
            },
            'image/jpeg',
            quality
          );
        };

        img.onerror = () => {
          // If decoding fails, fall back gracefully to original file
          resolve(file);
        };

        img.src = event.target.result;
      };

      reader.onerror = () => {
        resolve(file);
      };

      reader.readAsDataURL(file);
    } catch {
      // In case of any browser API limitation, return original file
      resolve(file);
    }
  });
}
