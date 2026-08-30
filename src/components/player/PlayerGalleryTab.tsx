import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

import { useAuth } from '../../lib/auth-client'
import { getGalleryPhotosFn } from '../../server/api'
import { Button, Dialog, SectionTitle } from '../ui'

type PhotoItem = {
  id: string
  storagePath: string
  url?: string
  caption: string | null
  createdAt: Date | string
}

export function PlayerGalleryTab() {
  const { token } = useAuth()
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [activePhoto, setActivePhoto] = useState<PhotoItem | null>(null)

  const loadPhotos = useCallback(() => {
    if (!token) return
    setIsLoading(true)
    setLoadError('')
    getGalleryPhotosFn({ data: { sessionToken: token } })
      .then((list) => {
        setPhotos(list || [])
      })
      .catch((err: any) => {
        setLoadError(err?.message || 'Qalad ayaa dhacay soo dejinta sawirrada')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [token])

  useEffect(() => {
    loadPhotos()
  }, [loadPhotos])

  return (
    <div className="space-y-6 pb-12">
      <div>
        <SectionTitle eyebrow="SAWIRRADA & XUSUUHAHA" as="h2">
          Sawirrada Kooxda
        </SectionTitle>
        <p className="text-xs text-chalk-dim">
          Daawo xusuusyada, kulamada, iyo dabaaldegyada kooxda
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-club-border bg-surface text-gold">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" />
          <span>Soo dejinaya sawirrada kooxda...</span>
        </div>
      ) : loadError ? (
        <div className="rounded-xl border border-danger/40 bg-surface p-6 text-center space-y-3">
          <AlertCircle className="h-6 w-6 text-danger mx-auto" />
          <p className="text-sm text-danger m-0">{loadError}</p>
          <Button
            type="button"
            variant="secondary"
            className="text-xs"
            onClick={loadPhotos}
          >
            Dib u tijaabi
          </Button>
        </div>
      ) : photos.length === 0 ? (
        <div className="rounded-xl border border-club-border bg-surface p-6 text-center text-sm text-chalk-dim">
          Weli ma jiraan sawirro lagu daray gallery-ga kooxda.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative overflow-hidden rounded-xl border border-club-border bg-surface shadow-md transition-all hover:border-gold/50"
            >
              <button
                type="button"
                onClick={() => setActivePhoto(photo)}
                className="block w-full aspect-square overflow-hidden bg-pitch-deep cursor-pointer"
              >
                <img
                  src={photo.url || photo.storagePath}
                  alt={photo.caption || 'Sawirka kooxda'}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </button>

              {photo.caption ? (
                <div className="p-2.5">
                  <span className="text-xs font-semibold text-chalk truncate block">
                    {photo.caption}
                  </span>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={Boolean(activePhoto)}
        onClose={() => setActivePhoto(null)}
        title={activePhoto?.caption || 'Sawirka Kooxda'}
      >
        {activePhoto ? (
          <div className="space-y-3">
            <div className="overflow-hidden rounded-xl border border-club-border bg-pitch-deep">
              <img
                src={activePhoto.url || activePhoto.storagePath}
                alt={activePhoto.caption || 'Sawir'}
                className="w-full max-h-[60vh] object-contain"
              />
            </div>
            {activePhoto.caption ? (
              <p className="text-sm font-semibold text-chalk text-center m-0">
                {activePhoto.caption}
              </p>
            ) : null}
            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setActivePhoto(null)}>
                Xir
              </Button>
            </div>
          </div>
        ) : null}
      </Dialog>
    </div>
  )
}
