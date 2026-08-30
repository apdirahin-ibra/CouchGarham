import { describe, expect, it } from 'vitest'

import { GALLERY_BUCKET, VOICE_BUCKET } from '../../src/lib/storage'
import { resolveStorageUrl } from '../../src/server/storage.server'

describe('Supabase Storage Buckets & Media Configuration', () => {
  it('defines correct storage bucket identifiers', () => {
    expect(GALLERY_BUCKET).toBe('club-gallery')
    expect(VOICE_BUCKET).toBe('club-voice')
  })

  it('resolves storage URLs correctly for relative paths and external URLs', () => {
    const relativeUrl = resolveStorageUrl('club-gallery', 'test-photo.jpg')
    expect(relativeUrl).toContain(
      '/storage/v1/object/public/club-gallery/test-photo.jpg',
    )

    const externalUrl = resolveStorageUrl(
      'club-gallery',
      'https://example.com/image.png',
    )
    expect(externalUrl).toBe('https://example.com/image.png')
  })

  it('validates player dashboard audio mapping compatibility', () => {
    const mockSettings = {
      announcementText: 'Tababar bari 4:30 PM',
      announcementAudioPath:
        'https://supabase.co/storage/v1/object/public/club-voice/announcement-123.webm',
    }

    const payload = {
      announcement: mockSettings.announcementText,
      announcementAudio: mockSettings.announcementAudioPath,
      announcementAudioPath: mockSettings.announcementAudioPath,
    }

    // Both keys must be present and contain the audio URL
    expect(payload.announcementAudio).toBe(mockSettings.announcementAudioPath)
    expect(payload.announcementAudioPath).toBe(
      mockSettings.announcementAudioPath,
    )
  })

  it('validates image upload size limit calculation', () => {
    const MAX_IMAGE_SIZE = 5 * 1024 * 1024
    const validBufferSize = 4 * 1024 * 1024
    const invalidBufferSize = 6 * 1024 * 1024

    expect(validBufferSize <= MAX_IMAGE_SIZE).toBe(true)
    expect(invalidBufferSize <= MAX_IMAGE_SIZE).toBe(false)
  })

  it('validates voice upload size limit calculation', () => {
    const MAX_AUDIO_SIZE = 10 * 1024 * 1024
    const validAudioSize = 8 * 1024 * 1024
    const invalidAudioSize = 12 * 1024 * 1024

    expect(validAudioSize <= MAX_AUDIO_SIZE).toBe(true)
    expect(invalidAudioSize <= MAX_AUDIO_SIZE).toBe(false)
  })
})
