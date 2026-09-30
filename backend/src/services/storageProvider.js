// Same provider-swap pattern as aiProvider.js: routes only ever call
// uploadToCloudinary() / promoteToS3(), never touch an SDK directly.
// Real credentials (CLOUDINARY_URL / AWS_*) can be dropped into .env later
// without any route or model change.
import crypto from 'crypto';
import { config } from '../config/index.js';

const hasCloudinary = Boolean(process.env.CLOUDINARY_URL);
const hasS3 = Boolean(process.env.AWS_S3_BUCKET && process.env.AWS_REGION);

function fakeId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

export async function uploadToCloudinary(file) {
  if (!hasCloudinary) {
    // Mock: no network call, just a realistic-looking result.
    const publicId = fakeId('cld');
    return { publicId, url: `https://res.cloudinary.com/mock/${publicId}/${file.originalname}` };
  }
  // A real integration would call the Cloudinary SDK here, using the same
  // { publicId, url } return shape so the route code never has to change.
  throw new Error('Real Cloudinary upload not configured in this environment');
}

export async function promoteToS3({ publicId, filename }) {
  if (!hasS3) {
    const key = `promoted/${publicId}-${filename}`;
    return { key, url: `https://mock-bucket.s3.${config.aws?.region || 'us-east-1'}.amazonaws.com/${key}` };
  }
  throw new Error('Real S3 promotion not configured in this environment');
}
