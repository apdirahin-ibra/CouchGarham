import { describe, expect, it } from 'vitest'

import {
  GALLERY_BUCKET,
  VOICE_BUCKET,
  resolveStorageUrl,
  validateAudioSignature,
  validateImageSignature,
} from '../../src/server/storage.server'

describe('Storage & Media Security Integration', () => {
  describe('Image Signature (Magic Bytes) Verification', () => {
    it('accepts valid JPEG buffer', () => {
      const jpegBuffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46,
      ])
      expect(validateImageSignature(jpegBuffer)).toBe(true)
    })

    it('accepts valid PNG buffer', () => {
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ])
      expect(validateImageSignature(pngBuffer)).toBe(true)
    })

    it('accepts valid WEBP buffer', () => {
      const webpHeader = Buffer.from('RIFF....WEBPVP8 ', 'ascii')
      expect(validateImageSignature(webpHeader)).toBe(true)
    })

    it('accepts valid GIF buffer', () => {
      const gifBuffer = Buffer.from('GIF89a...', 'ascii')
      expect(validateImageSignature(gifBuffer)).toBe(true)
    })

    it('rejects HTML/Script injection masquerading as image', () => {
      const evilBuffer = Buffer.from('<script>alert(1)</script>', 'utf8')
      expect(validateImageSignature(evilBuffer)).toBe(false)
    })

    it('rejects plain text files', () => {
      const textBuffer = Buffer.from(
        'Just some random text file content',
        'utf8',
      )
      expect(validateImageSignature(textBuffer)).toBe(false)
    })
  })

  describe('Audio Signature (Magic Bytes) Verification', () => {
    it('accepts valid WebM / EBML audio buffer', () => {
      const webmBuffer = Buffer.from([
        0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x86, 0x81,
      ])
      expect(validateAudioSignature(webmBuffer)).toBe(true)
    })

    it('accepts valid MP4 / M4A buffer', () => {
      const mp4Buffer = Buffer.from([
        0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x70, 0x34, 0x32,
      ])
      expect(validateAudioSignature(mp4Buffer)).toBe(true)
    })

    it('accepts valid MP3 buffer with ID3 header', () => {
      const mp3Buffer = Buffer.from('ID3\x03\x00\x00\x00\x00\x00\x00', 'binary')
      expect(validateAudioSignature(mp3Buffer)).toBe(true)
    })

    it('accepts valid WAV buffer', () => {
      const wavBuffer = Buffer.from('RIFF\x24\x00\x00\x00WAVEfmt ', 'ascii')
      expect(validateAudioSignature(wavBuffer)).toBe(true)
    })

    it('accepts valid OGG buffer', () => {
      const oggBuffer = Buffer.from('OggS\x00\x02\x00\x00', 'ascii')
      expect(validateAudioSignature(oggBuffer)).toBe(true)
    })

    it('rejects invalid executable or script files masquerading as audio', () => {
      const fakeAudio = Buffer.from('MZ\x90\x00\x03\x00\x00\x00', 'binary')
      expect(validateAudioSignature(fakeAudio)).toBe(false)
    })
  })

  describe('Storage URL Resolution & Buckets', () => {
    it('verifies standard bucket names', () => {
      expect(GALLERY_BUCKET).toBe('club-gallery')
      expect(VOICE_BUCKET).toBe('club-voice')
    })

    it('resolves storage URLs correctly for storage paths', () => {
      const resolved = resolveStorageUrl('club-gallery', 'test-item-123.jpg')
      expect(resolved).toContain(
        '/storage/v1/object/public/club-gallery/test-item-123.jpg',
      )
    })

    it('preserves absolute URLs untouched', () => {
      const external = 'https://images.unsplash.com/photo-football.jpg'
      expect(resolveStorageUrl('club-gallery', external)).toBe(external)
    })
  })
})
