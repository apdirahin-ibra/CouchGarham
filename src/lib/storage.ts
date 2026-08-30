import { createClient } from '@supabase/supabase-js'

export const GALLERY_BUCKET = 'club-gallery'
export const VOICE_BUCKET = 'club-voice'

let supabaseClientInstance: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (supabaseClientInstance) return supabaseClientInstance

  const url =
    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
    (typeof import.meta !== 'undefined' &&
      import.meta.env?.VITE_SUPABASE_URL) ||
    'https://placeholder.supabase.co'

  const anonKey =
    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
    (typeof import.meta !== 'undefined' &&
      import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
    'placeholder-anon-key'

  supabaseClientInstance = createClient(url, anonKey)
  return supabaseClientInstance
}

/**
 * Uploads an image file to Supabase Storage club-gallery bucket.
 */
export async function uploadGalleryFile(
  file: File | Blob,
  fileName?: string,
): Promise<{ storagePath: string; publicUrl: string }> {
  const supabase = getSupabaseClient()
  const cleanExt =
    file instanceof File && file.name.includes('.')
      ? file.name.split('.').pop()
      : 'jpg'
  const path = `${Date.now()}-${crypto.randomUUID()}.${cleanExt}`
  const targetPath = fileName || path

  const { data, error } = await supabase.storage
    .from(GALLERY_BUCKET)
    .upload(targetPath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'image/jpeg',
    })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  const { data: publicUrlData } = supabase.storage
    .from(GALLERY_BUCKET)
    .getPublicUrl(data.path)

  return {
    storagePath: data.path,
    publicUrl: publicUrlData.publicUrl,
  }
}

/**
 * Deletes an image file from Supabase Storage club-gallery bucket.
 */
export async function deleteGalleryFile(storagePath: string): Promise<void> {
  const supabase = getSupabaseClient()
  const { error } = await supabase.storage
    .from(GALLERY_BUCKET)
    .remove([storagePath])

  if (error) {
    console.warn(`Storage delete warning for ${storagePath}:`, error.message)
  }
}

/**
 * Uploads a voice announcement audio recording to Supabase Storage.
 */
export async function uploadVoiceRecording(
  audioBlob: Blob,
): Promise<{ storagePath: string; publicUrl: string }> {
  const supabase = getSupabaseClient()
  const path = `announcement-${Date.now()}-${crypto.randomUUID()}.webm`

  const { data, error } = await supabase.storage
    .from(VOICE_BUCKET)
    .upload(path, audioBlob, {
      cacheControl: '3600',
      upsert: true,
      contentType: audioBlob.type || 'audio/webm',
    })

  if (error) {
    throw new Error(`Voice upload failed: ${error.message}`)
  }

  const { data: publicUrlData } = supabase.storage
    .from(VOICE_BUCKET)
    .getPublicUrl(data.path)

  return {
    storagePath: data.path,
    publicUrl: publicUrlData.publicUrl,
  }
}
