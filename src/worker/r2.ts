export interface UploadResult {
  success: boolean;
  key: string;
  url: string;
}

export async function uploadFile(
  bucket: R2Bucket,
  file: File,
  prefix = "uploads",
): Promise<UploadResult> {
  const key = `${prefix}/${Date.now()}-${file.name}`;
  await bucket.put(key, file);
  return {
    success: true,
    key,
    url: `/api/files/${key}`,
  };
}

export async function getFile(bucket: R2Bucket, key: string): Promise<Response | null> {
  const obj = await bucket.get(key);
  if (!obj) return null;

  return new Response(obj.body, {
    headers: {
      "Content-Type": obj.httpMetadata?.contentType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000",
    },
  });
}

export async function deleteFile(bucket: R2Bucket, key: string): Promise<boolean> {
  await bucket.delete(key);
  return true;
}
