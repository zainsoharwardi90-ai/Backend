const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary public_ids do not include the file extension; the format is
// managed by Cloudinary itself. This strips the extension from a key like
// "uploads/123-video.mp4" -> "uploads/123-video" so the folder structure is
// preserved while Cloudinary infers the format from the upload.
function toCloudinaryPublicId(key) {
  return key.replace(/\.[a-z0-9]+$/i, '');
}

async function uploadFile(key, buffer, contentType) {
  const result = await cloudinary.uploader.upload(buffer, {
    resource_type: 'video',
    public_id: toCloudinaryPublicId(key),
  });
  return result.secure_url;
}

// Returns the public URL for a stored resource. The resource is served by
// Cloudinary's CDN, so this resolves to the CDN URL.
async function getFileStream(key) {
  return cloudinary.url(toCloudinaryPublicId(key), { resource_type: 'video' });
}

async function deleteFile(key) {
  await cloudinary.uploader.destroy(toCloudinaryPublicId(key), {
    resource_type: 'video',
  });
}

function getPublicUrl(key) {
  return cloudinary.url(toCloudinaryPublicId(key), { resource_type: 'video' });
}

module.exports = { uploadFile, getFileStream, deleteFile, getPublicUrl };
