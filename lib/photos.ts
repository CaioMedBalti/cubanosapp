import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL, listAll } from 'firebase/storage';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

// Redimensiona/comprime a foto do scan antes do envio: fotos de câmera em
// base64 estouram o limite de 4,5 MB do body das funções Vercel (Erro 413).
export async function compressScanPhoto(uri: string): Promise<{
  uri: string;
  base64: string;
  mimeType: 'image/jpeg';
}> {
  const context = ImageManipulator.manipulate(uri);
  // height omitido: calculado automaticamente preservando a proporção
  // (não usar null — a implementação web só ignora height se for undefined).
  context.resize({ width: 1280 });
  const rendered = await context.renderAsync();
  const result = await rendered.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.7,
    base64: true,
  });
  return { uri: result.uri, base64: result.base64 ?? '', mimeType: 'image/jpeg' };
}

export async function uploadUserCigarPhoto(userId: string, blob: Blob): Promise<string> {
  const path = `users/${userId}/cigars/${Date.now()}.jpg`;
  const r = ref(storage, path);
  await uploadBytes(r, blob);
  return getDownloadURL(r);
}

export async function uploadScanPhoto(userId: string, blob: Blob): Promise<string> {
  const path = `users/${userId}/scans/${Date.now()}.jpg`;
  const r = ref(storage, path);
  await uploadBytes(r, blob);
  return getDownloadURL(r);
}

export async function uploadUserAvatar(userId: string, blob: Blob): Promise<string> {
  // Path estável: trocar o avatar sobrescreve o anterior em vez de acumular.
  const r = ref(storage, `users/${userId}/avatar.jpg`);
  await uploadBytes(r, blob);
  return getDownloadURL(r);
}

export async function getStockPhotoUrls(): Promise<string[]> {
  const listRef = ref(storage, 'cigar-stock');
  const result = await listAll(listRef);
  if (result.items.length === 0) return [];
  return Promise.all(result.items.map((item) => getDownloadURL(item)));
}
