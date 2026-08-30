import '@tanstack/react-start/server-only'

import { createClient } from '@supabase/supabase-js'
import { eq } from 'drizzle-orm'

import { getDatabase } from '../db/connection.server'
import { clubSettings, galleryPhotos } from '../db/schema'
import { getServerEnv } from '../lib/env.server'

export const GALLERY_BUCKET = 'club-gallery'
export const VOICE_BUCKET = 'club-voice'

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]

const MAX_AUDIO_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
const ALLOWED_AUDIO_MIMES = [
  'audio/webm',
  'audio/mp4',
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
]

let supabaseAdminInstance: ReturnType<typeof createClient> | null = null

export function getSupabaseAdminClient() {
  if (supabaseAdminInstance) return supabaseAdminInstance
  const env = getServerEnv()
  supabaseAdminInstance = createClient(
    env.public.SUPABASE_URL,
    env.secrets.SUPABASE_SERVICE_ROLE_KEY,
  )
  return supabaseAdminInstance
}

export function resolveStorageUrl(
  bucket: string,
  storagePath: string,
  baseUrl?: string,
): string {
  if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
    return storagePath
  }
  const supabaseUrl =
    baseUrl ||
    (typeof process !== 'undefined' && process.env?.SUPABASE_URL) ||
    'https://supabase.co'
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`
}

/**
 * Uploads gallery photo via Admin Service Role with format & size validation (C5-02 & H5-01).
 */
export async function uploadGalleryPhotoServer(input: {
  base64Data: string
  mimeType: string
  caption?: string | null
  uploadedBy: string
}) {
  const cleanMime = input.mimeType.split(';')[0].trim().toLowerCase()
  if (!ALLOWED_IMAGE_MIMES.includes(cleanMime)) {
    throw new Error(
      `Nooca sawirka lama oggola (${cleanMime}). Fadlan isticmaal JPG, PNG, ama WEBP.`,
    )
  }

  const buffer = Buffer.from(input.base64Data, 'base64')
  if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('Cabbirka sawirku waa inuu ka yaryahay 5 MB.')
  }

  const ext = cleanMime.split('/')[1] || 'jpg'
  const objectPath = `${Date.now()}-${crypto.randomUUID()}.${ext}`

  const supabase = getSupabaseAdminClient()
  const { error } = await supabase.storage
    .from(GALLERY_BUCKET)
    .upload(objectPath, buffer, {
      contentType: cleanMime,
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    throw new Error(`Ku guuldareystay shubista sawirka: ${error.message}`)
  }

  const db = getDatabase()
  const [inserted] = await db
    .insert(galleryPhotos)
    .values({
      storageBucket: GALLERY_BUCKET,
      storagePath: objectPath,
      caption: input.caption?.trim() || null,
      uploadedBy: input.uploadedBy,
    })
    .returning()

  return {
    ...inserted,
    url: resolveStorageUrl(GALLERY_BUCKET, inserted.storagePath),
  }
}

/**
 * Deletes gallery photo from PostgreSQL and Supabase Storage bucket atomically (H5-01).
 */
export async function deleteGalleryPhotoServer(photoId: string) {
  const db = getDatabase()
  const [photo] = await db
    .select()
    .from(galleryPhotos)
    .where(eq(galleryPhotos.id, photoId))
    .limit(1)

  if (!photo) {
    throw new Error('Sawirkan lama helin')
  }

  // Delete from Storage if it's an object key (not external URL)
  if (
    !photo.storagePath.startsWith('http://') &&
    !photo.storagePath.startsWith('https://')
  ) {
    try {
      const supabase = getSupabaseAdminClient()
      await supabase.storage
        .from(photo.storageBucket)
        .remove([photo.storagePath])
    } catch (err) {
      console.warn(`Could not delete storage object ${photo.storagePath}:`, err)
    }
  }

  await db.delete(galleryPhotos).where(eq(galleryPhotos.id, photoId))
  return { success: true, deletedId: photoId }
}

/**
 * Uploads voice announcement audio via Admin Service Role, replacing previous recording (H5-02).
 */
export async function uploadVoiceAnnouncementServer(input: {
  base64Audio: string
  mimeType: string
}) {
  const cleanMime = input.mimeType.split(';')[0].trim().toLowerCase()
  if (!ALLOWED_AUDIO_MIMES.includes(cleanMime)) {
    throw new Error(`Nooca codka lama oggola (${cleanMime}).`)
  }

  const buffer = Buffer.from(input.base64Audio, 'base64')
  if (buffer.length > MAX_AUDIO_SIZE_BYTES) {
    throw new Error('Cabbirka codku waa inuu ka yaryahay 10 MB.')
  }

  const db = getDatabase()
  const [existingSettings] = await db
    .select()
    .from(clubSettings)
    .where(eq(clubSettings.id, 'default'))
    .limit(1)

  // Remove old audio object from Storage if one existed
  if (existingSettings?.announcementAudioPath) {
    const oldPath = existingSettings.announcementAudioPath
    const fileName = oldPath.includes('/') ? oldPath.split('/').pop() : oldPath
    if (fileName) {
      try {
        const supabase = getSupabaseAdminClient()
        await supabase.storage.from(VOICE_BUCKET).remove([fileName])
      } catch (err) {
        console.warn(`Could not remove old voice object:`, err)
      }
    }
  }

  const ext = cleanMime.split('/')[1]?.split(';')[0] || 'webm'
  const objectPath = `announcement-${Date.now()}-${crypto.randomUUID()}.${ext}`

  const supabase = getSupabaseAdminClient()
  const { error } = await supabase.storage
    .from(VOICE_BUCKET)
    .upload(objectPath, buffer, {
      contentType: cleanMime,
      cacheControl: '3600',
      upsert: true,
    })

  if (error) {
    throw new Error(`Ku guuldareystay shubista codka: ${error.message}`)
  }

  const publicUrl = resolveStorageUrl(VOICE_BUCKET, objectPath)

  await db
    .update(clubSettings)
    .set({
      announcementAudioPath: publicUrl,
    })
    .where(eq(clubSettings.id, 'default'))

  return { publicUrl, storagePath: objectPath }
}

/**
 * Deletes current voice announcement audio and cleans up Storage object (H5-02).
 */
export async function deleteVoiceAnnouncementServer() {
  const db = getDatabase()
  const [existingSettings] = await db
    .select()
    .from(clubSettings)
    .where(eq(clubSettings.id, 'default'))
    .limit(1)

  if (existingSettings?.announcementAudioPath) {
    const oldPath = existingSettings.announcementAudioPath
    const fileName = oldPath.includes('/') ? oldPath.split('/').pop() : oldPath
    if (fileName) {
      try {
        const supabase = getSupabaseAdminClient()
        await supabase.storage.from(VOICE_BUCKET).remove([fileName])
      } catch (err) {
        console.warn(`Could not delete voice file from bucket:`, err)
      }
    }
  }

  await db
    .update(clubSettings)
    .set({ announcementAudioPath: null })
    .where(eq(clubSettings.id, 'default'))

  return { success: true }
}
