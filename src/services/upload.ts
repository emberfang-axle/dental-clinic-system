import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

/**
 * Uploads a file to Firebase Storage and returns the download URL.
 * @param file - The file to upload
 * @param path - Storage path e.g. "treatment-photos/appt_123.jpg"
 * @param onProgress - Optional callback with 0-100 progress
 */
export function uploadFile(
  file: File,
  path: string,
  onProgress?: (pct: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path);
    const task = uploadBytesResumable(storageRef, file);

    task.on(
      "state_changed",
      (snap) => {
        if (onProgress) {
          onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
        }
      },
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve(url);
      }
    );
  });
}

export function treatmentPhotoPath(appointmentId: string, type: "before" | "after", fileName: string) {
  return `treatment-photos/${appointmentId}/${type}-${Date.now()}-${fileName}`;
}
