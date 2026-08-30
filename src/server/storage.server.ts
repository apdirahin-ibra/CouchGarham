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

/**
 * Extracts storage object key from relative path or full storage URL.
 */
export function extractStorageKeyFromPath(pathOrUrl: string): string {
  if (!pathOrUrl) return ''
  if (pathOrUrl.includes('/club-voice/')) {
    return (
      pathOrUrl.split('/club-voice/')[1]?.split('?')[0] ||
      pathOrUrl.split('/').pop() ||
      pathOrUrl
    )
  }
  if (pathOrUrl.includes('/club-gallery/')) {
    return (
      pathOrUrl.split('/club-gallery/')[1]?.split('?')[0] ||
      pathOrUrl.split('/').pop() ||
      pathOrUrl
    )
  }
  return pathOrUrl.includes('/')
    ? pathOrUrl.split('/').pop() || pathOrUrl
    : pathOrUrl
}

export function resolveStorageUrl(
  bucket: string,
  storagePath: string,
  baseUrl?: string,
): string {
  if (!storagePath) return ''
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
 * Validates magic bytes signature of binary buffer (M6-02).
 */
export function validateImageSignature(buffer: Buffer): boolean {
  if (buffer.length < 4) return false
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)
    return true
  // PNG: 89 50 4E 47
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  )
    return true
  // GIF: GIF87a or GIF89a
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  )
    return true
  // WEBP: RIFF....WEBP
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  )
    return true

  return false
}

/**
 * Validates audio format magic bytes signature (M6-02).
 */
export function validateAudioSignature(buffer: Buffer): boolean {
  if (buffer.length < 4) return false
  // WebM / EBML: 1A 45 DF A3
  if (
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  )
    return true
  // MP4 / M4A: ftyp at offset 4
  if (buffer.length >= 8 && buffer.subarray(4, 8).toString('ascii') === 'ftyp')
    return true
  // MP3: ID3 or frame sync FF FB / FF F3 / FF F2
  if (
    buffer.subarray(0, 3).toString('ascii') === 'ID3' ||
    (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0)
  )
    return true
  // WAV: RIFF....WAVE
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WAVE'
  )
    return true
  // OGG: OggS
  if (buffer.subarray(0, 4).toString('ascii') === 'OggS') return true

  return false
}

/**
 * Uploads gallery photo via Admin Service Role with failure compensation (H6-01 & H6-02).
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

  if (!validateImageSignature(buffer)) {
    throw new Error(
      'Feylka la geliyay ma aha sawir sax ah (Invalid image signature).',
    )
  }

  const ext = cleanMime.split('/')[1] || 'jpg'
  const objectPath = `${Date.now()}-${crypto.randomUUID()}.${ext}`

  const supabase = getSupabaseAdminClient()
  const { error: uploadError } = await supabase.storage
    .from(GALLERY_BUCKET)
    .upload(objectPath, buffer, {
      contentType: cleanMime,
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    throw new Error(`Ku guuldareystay shubista sawirka: ${uploadError.message}`)
  }

  try {
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
  } catch (dbError: any) {
    // Compensate: Clean up orphaned storage object if DB insert failed
    const { error: cleanupError } = await supabase.storage
      .from(GALLERY_BUCKET)
      .remove([objectPath])
    if (cleanupError) {
      console.error(
        `Failed to compensate storage cleanup for ${objectPath}:`,
        cleanupError.message,
      )
    }
    throw new Error(
      `Ku guuldareystay keydinta xogta sawirka: ${dbError?.message || 'Database error'}`,
      { cause: dbError },
    )
  }
}

/**
 * Deletes gallery photo from PostgreSQL and Supabase Storage bucket with error handling (H6-01).
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

  const fileName = extractStorageKeyFromPath(photo.storagePath)
  if (fileName) {
    const supabase = getSupabaseAdminClient()
    const { error: removeError } = await supabase.storage
      .from(photo.storageBucket)
      .remove([fileName])

    if (removeError) {
      throw new Error(
        `Ku guuldareystay tirtirista sawirka Storage: ${removeError.message}`,
      )
    }
  }

  await db.delete(galleryPhotos).where(eq(galleryPhotos.id, photoId))
  return { success: true, deletedId: photoId }
}

/**
 * Uploads voice announcement audio, safely persisting new object before deleting old (H6-02 & Recheck 7).
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

  if (!validateAudioSignature(buffer)) {
    throw new Error(
      'Feylka la geliyay ma aha cod sax ah (Invalid audio signature).',
    )
  }

  const db = getDatabase()
  const [existingSettings] = await db
    .select()
    .from(clubSettings)
    .where(eq(clubSettings.id, 'default'))
    .limit(1)

  const oldAudioPath = existingSettings?.announcementAudioPath

  const ext = cleanMime.split('/')[1]?.split(';')[0] || 'webm'
  const objectPath = `announcement-${Date.now()}-${crypto.randomUUID()}.${ext}`

  const supabase = getSupabaseAdminClient()
  const { error: uploadError } = await supabase.storage
    .from(VOICE_BUCKET)
    .upload(objectPath, buffer, {
      contentType: cleanMime,
      cacheControl: '3600',
      upsert: true,
    })

  if (uploadError) {
    throw new Error(`Ku guuldareystay shubista codka: ${uploadError.message}`)
  }

  try {
    await db
      .update(clubSettings)
      .set({
        announcementAudioPath: objectPath,
      })
      .where(eq(clubSettings.id, 'default'))
  } catch (dbError: any) {
    // Compensate: Delete newly uploaded audio if DB update failed
    const { error: cleanupError } = await supabase.storage
      .from(VOICE_BUCKET)
      .remove([objectPath])
    if (cleanupError) {
      console.error(
        `Failed to compensate voice cleanup for ${objectPath}:`,
        cleanupError.message,
      )
    }
    throw new Error(
      `Ku guuldareystay keydinta codka database-ka: ${dbError?.message || 'DB error'}`,
      { cause: dbError },
    )
  }

  // Best-effort cleanup of old audio object AFTER new audio is safely persisted (Recheck 7)
  if (oldAudioPath) {
    const oldFileName = extractStorageKeyFromPath(oldAudioPath)
    if (oldFileName) {
      const { error: oldRemoveError } = await supabase.storage
        .from(VOICE_BUCKET)
        .remove([oldFileName])
      if (oldRemoveError) {
        console.warn(
          `Could not remove old voice object ${oldFileName}:`,
          oldRemoveError.message,
        )
      }
    }
  }

  const publicUrl = resolveStorageUrl(VOICE_BUCKET, objectPath)
  return { publicUrl, storagePath: objectPath }
}

/**
 * Deletes current voice announcement audio and cleans up Storage object (H6-01 & Recheck 7).
 */
export async function deleteVoiceAnnouncementServer() {
  const db = getDatabase()
  const [existingSettings] = await db
    .select()
    .from(clubSettings)
    .where(eq(clubSettings.id, 'default'))
    .limit(1)

  if (existingSettings?.announcementAudioPath) {
    const fileName = extractStorageKeyFromPath(
      existingSettings.announcementAudioPath,
    )
    if (fileName) {
      const supabase = getSupabaseAdminClient()
      const { error: removeError } = await supabase.storage
        .from(VOICE_BUCKET)
        .remove([fileName])
      if (removeError) {
        console.warn(
          `Storage delete warning for voice file ${fileName}:`,
          removeError.message,
        )
      }
    }
  }

  await db
    .update(clubSettings)
    .set({ announcementAudioPath: null })
    .where(eq(clubSettings.id, 'default'))

  return { success: true }
}
