import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL, listAll } from 'firebase/storage';

export async function uploadUserCigarPhoto(userId: string, blob: Blob): Promise<string> {
  const path = `users/${userId}/cigars/${Date.now()}.jpg`;
  const r = ref(storage, path);
  await uploadBytes(r, blob);
  return getDownloadURL(r);
}

export async function getStockPhotoUrls(): Promise<string[]> {
  const listRef = ref(storage, 'cigar-stock');
  const result = await listAll(listRef);
  if (result.items.length === 0) return [];
  return Promise.all(result.items.map((item) => getDownloadURL(item)));
}
