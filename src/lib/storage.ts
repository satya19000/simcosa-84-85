// Client-side Firebase Storage helpers. Uploads/deletes happen in the
// browser (already Firebase-authenticated) — there is no firebase-admin in
// this project, so the server never touches Storage directly. Server
// functions only ever receive/store the resulting URL + object path.
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { getFirebaseApp } from "@/lib/firebase";

export interface UploadResult {
  url: string;
  path: string;
}

export async function uploadToFirebaseStorage(
  file: File,
  folder: string,
  userId: string,
): Promise<UploadResult> {
  const storage = getStorage(getFirebaseApp());
  const path = `${folder}/${userId}/${crypto.randomUUID()}-${file.name}`;
  const objectRef = ref(storage, path);
  await uploadBytes(objectRef, file);
  const url = await getDownloadURL(objectRef);
  return { url, path };
}

export async function deleteFromFirebaseStorage(path: string): Promise<void> {
  const storage = getStorage(getFirebaseApp());
  try {
    await deleteObject(ref(storage, path));
  } catch (err) {
    const code = (err as { code?: string } | null)?.code;
    if (code === "storage/object-not-found") {
      return;
    }
    throw err;
  }
}
