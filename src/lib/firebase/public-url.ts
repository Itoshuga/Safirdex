export function buildFirebaseStorageUrl(
  bucketName: string,
  storagePath: string,
  downloadToken: string,
) {
  return `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucketName)}/o/${encodeURIComponent(storagePath)}?alt=media&token=${encodeURIComponent(downloadToken)}`;
}
