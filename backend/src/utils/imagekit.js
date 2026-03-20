const ImageKit = require('imagekit');

let _ik = null;

function getImageKit() {
  if (_ik) return _ik;
  if (!process.env.IMAGEKIT_PUBLIC_KEY || !process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_URL_ENDPOINT) {
    throw new Error('ImageKit environment variables not configured. Set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT in your .env file.');
  }
  _ik = new ImageKit({
    publicKey:   process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey:  process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
  });
  return _ik;
}

/**
 * Upload a buffer or base64 string to ImageKit.
 * @param {Buffer|string} fileBuffer  - File buffer from multer, or base64 string
 * @param {string}        fileName    - File name to use on ImageKit
 * @param {string}        folder      - ImageKit folder path  e.g. '/nexabank/avatars'
 * @returns {Promise<{url: string, fileId: string, name: string}>}
 */
async function uploadToImageKit(fileBuffer, fileName, folder = '/nexabank/avatars') {
  const ik = getImageKit();

  const response = await ik.upload({
    file:   fileBuffer,   // Buffer or base64
    fileName,
    folder,
    useUniqueFileName: true,
    tags:   ['nexabank', folder.replace('/', '')],
  });

  return {
    url:    response.url,
    fileId: response.fileId,
    name:   response.name,
  };
}

/**
 * Delete a file from ImageKit by fileId.
 */
async function deleteFromImageKit(fileId) {
  if (!fileId) return;
  try {
    const ik = getImageKit();
    await ik.deleteFile(fileId);
  } catch (e) {
    console.warn('ImageKit delete warning:', e.message);
  }
}

module.exports = { uploadToImageKit, deleteFromImageKit };
