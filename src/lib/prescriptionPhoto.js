import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

const BUCKET = 'prescription-photos';

/**
 * Abre la galería, sube la foto elegida al bucket privado y devuelve el
 * PATH guardado (no una URL — el bucket no es público, hay que pedir una
 * URL firmada cada vez que se muestra, ver getPrescriptionPhotoUrl). null
 * si el usuario canceló.
 */
export async function pickAndUploadPrescriptionPhoto(familyId, prescriptionId) {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error('Sin permiso para acceder a tus fotos.');

  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const response = await fetch(asset.uri);
  const blob = await response.blob();
  const path = `${familyId}/${prescriptionId}/${Date.now()}.jpg`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;
  return path;
}

/** URL firmada temporal para mostrar la foto — el bucket es privado, no hay URL pública fija. */
export async function getPrescriptionPhotoUrl(path) {
  if (!path) return null;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}

/** Borra el archivo del bucket — se llama al quitar la foto, para no dejar huérfanos. */
export async function deletePrescriptionPhoto(path) {
  if (!path) return;
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}
