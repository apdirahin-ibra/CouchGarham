import { describe, expect, it } from 'vitest'

import { GALLERY_BUCKET, VOICE_BUCKET } from '../../src/lib/storage'

describe('Supabase Storage Buckets & Media Configuration', () => {
  it('defines correct storage bucket identifiers', () => {
    expect(GALLERY_BUCKET).toBe('club-gallery')
    expect(VOICE_BUCKET).toBe('club-voice')
  })
})
