import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import sharp from "sharp";

const s3 = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT || "http://localhost:9000",
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || "minioadmin",
    secretAccessKey: process.env.MINIO_SECRET_KEY || "minioadmin",
  },
  forcePathStyle: true, // Required for MinIO
});

const PUBLIC_BUCKET = process.env.MINIO_BUCKET_PUBLIC || "findmypet";
const PRIVATE_BUCKET = process.env.MINIO_BUCKET_PRIVATE || "findmypet-assets";

export interface ImageVariant {
  suffix: string;
  width: number;
  height: number;
  quality: number;
}

const PET_PHOTO_VARIANTS: ImageVariant[] = [
  { suffix: "thumb", width: 200, height: 200, quality: 80 },
  { suffix: "medium", width: 600, height: 600, quality: 85 },
  { suffix: "full", width: 1200, height: 1200, quality: 90 },
];

export interface UploadedImage {
  storageKey: string;
  urlThumb: string;
  urlMedium: string;
  urlFull: string;
}

/**
 * Upload a pet photo, generating thumb/medium/full variants in WebP.
 * Strips EXIF metadata (including GPS) for privacy.
 */
export async function uploadPetPhoto(
  file: Buffer,
  petId: string
): Promise<UploadedImage> {
  const timestamp = Date.now();
  const baseKey = `pets/${petId}/${timestamp}`;

  const urls: Record<string, string> = {};

  await Promise.all(
    PET_PHOTO_VARIANTS.map(async (variant) => {
      const optimized = await sharp(file)
        .rotate() // Auto-rotate based on EXIF, then strip EXIF
        .resize(variant.width, variant.height, { fit: "cover" })
        .webp({ quality: variant.quality })
        .toBuffer();

      const key = `${baseKey}_${variant.suffix}.webp`;

      await s3.send(
        new PutObjectCommand({
          Bucket: PUBLIC_BUCKET,
          Key: key,
          Body: optimized,
          ContentType: "image/webp",
        })
      );

      urls[variant.suffix] = getPublicUrl(key);
    })
  );

  return {
    storageKey: baseKey,
    urlThumb: urls.thumb,
    urlMedium: urls.medium,
    urlFull: urls.full,
  };
}

/**
 * Upload a file to the private bucket (QR codes, posters).
 * Returns a storage key for later retrieval.
 */
export async function uploadPrivateFile(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: PRIVATE_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return key;
}

/**
 * Upload a file to the public bucket.
 */
export async function uploadPublicFile(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: PUBLIC_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return getPublicUrl(key);
}

/**
 * Get a file from the private bucket.
 */
export async function getPrivateFile(key: string): Promise<Buffer> {
  const response = await s3.send(
    new GetObjectCommand({
      Bucket: PRIVATE_BUCKET,
      Key: key,
    })
  );
  const stream = response.Body;
  if (!stream) throw new Error("Empty response body");
  return Buffer.from(await stream.transformToByteArray());
}

/**
 * Delete files from the public bucket by prefix (e.g., all photo variants).
 */
export async function deletePublicFiles(keys: string[]): Promise<void> {
  await Promise.all(
    keys.map((key) =>
      s3.send(
        new DeleteObjectCommand({
          Bucket: PUBLIC_BUCKET,
          Key: key,
        })
      )
    )
  );
}

/**
 * Construct a public URL for a MinIO object.
 * In production this goes through Nginx proxy cache.
 */
function getPublicUrl(key: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${appUrl}/storage/${key}`;
}

/**
 * Validate that a file buffer is an allowed image type.
 * Checks magic bytes, not just file extension.
 */
export async function validateImageBuffer(
  buffer: Buffer
): Promise<{ valid: boolean; mimeType?: string }> {
  const metadata = await sharp(buffer).metadata();
  const allowedFormats = ["jpeg", "png", "webp", "heif"];

  if (metadata.format && allowedFormats.includes(metadata.format)) {
    return { valid: true, mimeType: `image/${metadata.format}` };
  }

  return { valid: false };
}
