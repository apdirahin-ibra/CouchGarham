import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  Image as ImageIcon,
  Plus,
  RefreshCw,
  Trash2,
  UploadCloud,
} from 'lucide-react'

import { useAuth } from '../../lib/auth-client'
import {
  addGalleryPhotoFn,
  deleteGalleryPhotoFn,
  getGalleryPhotosFn,
  uploadGalleryPhotoFn,
} from '../../server/api'
import { Button, Dialog, SectionTitle, TextField } from '../ui'
import { useToast } from '../ui/toast-context'

type PhotoItem = {
  id: string
  storagePath: string
  url?: string
  caption: string | null
  createdAt: Date | string
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function AdminGalleryTab() {
  const { token } = useAuth()
  const { notify } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [activePhoto, setActivePhoto] = useState<PhotoItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [manualUrl, setManualUrl] = useState('')
  const [caption, setCaption] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const loadPhotos = useCallback(async () => {
    if (!token) return
    setIsLoading(true)
    setLoadError('')
    try {
      const list = await getGalleryPhotosFn({ data: { sessionToken: token } })
      setPhotos(list || [])
    } catch (err: any) {
      setLoadError(err?.message || 'Qalad ayaa dhacay soo dejinta sawirrada')
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadPhotos()
  }, [loadPhotos])

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      notify('Fadlan soo dooro sawir ah JPG, PNG, ama WEBP.', 'danger')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      notify('Cabbirka sawirku waa inuu ka yaryahay 5 MB.', 'danger')
      return
    }

    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setManualUrl('')
  }

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!selectedFile && !manualUrl.trim()) || !token) return
    setIsUploading(true)

    try {
      if (selectedFile) {
        // Read file as base64 string
        const reader = new FileReader()
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string
            const base64 = result.split(',')[1] || ''
            resolve(base64)
          }
          reader.onerror = reject
          reader.readAsDataURL(selectedFile)
        })

        const base64Data = await base64Promise

        const created = await uploadGalleryPhotoFn({
          data: {
            sessionToken: token,
            base64Data,
            mimeType: selectedFile.type,
            caption: caption.trim() || null,
          },
        })

        setPhotos((current) => [created, ...current])
      } else {
        const created = await addGalleryPhotoFn({
          data: {
            sessionToken: token,
            storagePath: manualUrl.trim(),
            caption: caption.trim() || null,
          },
        })
        setPhotos((current) => [
          { ...created, url: created.storagePath },
          ...current,
        ])
      }

      setIsModalOpen(false)
      setSelectedFile(null)
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
      setPreviewUrl('')
      setManualUrl('')
      setCaption('')
      notify('Sawir cusub ayaa si guul leh loo geliyay Gallery-ga!', 'success')
    } catch (err: any) {
      notify(err?.message || 'Qalad ayaa dhacay gelinta sawirka', 'danger')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeletePhoto = async (photo: PhotoItem) => {
    if (!token) return
    try {
      await deleteGalleryPhotoFn({
        data: { sessionToken: token, id: photo.id },
      })
      setPhotos((current) => current.filter((p) => p.id !== photo.id))
      notify('Sawirkii waa la tirtiray', 'neutral')
    } catch (err: any) {
      notify(err?.message || 'Qalad ayaa dhacay tirtirista', 'danger')
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <SectionTitle eyebrow="SAWIRRADA KOOXDA" as="h2">
            Sawirrada iyo Xusuusaha (Gallery)
          </SectionTitle>
          <p className="text-xs text-chalk-dim">
            Sawirrada tababarka, kulamada, iyo dabaaldegyada kooxda
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setSelectedFile(null)
            if (previewUrl && previewUrl.startsWith('blob:')) {
              URL.revokeObjectURL(previewUrl)
            }
            setPreviewUrl('')
            setManualUrl('')
            setCaption('')
            setIsModalOpen(true)
          }}
          className="gap-1.5 self-start text-xs"
        >
          <Plus className="h-4 w-4" />
          <span>Kudar Sawir Cusub</span>
        </Button>
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
          Weli ma jiraan sawirro lagu daray gallery-ga.
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

              <div className="p-2.5 flex items-center justify-between">
                <span className="text-xs font-semibold text-chalk truncate max-w-[80%]">
                  {photo.caption || 'Sawirka Kooxda'}
                </span>

                <button
                  type="button"
                  onClick={() => handleDeletePhoto(photo)}
                  className="text-chalk-dim hover:text-danger p-1 transition-colors cursor-pointer"
                  title="Tirtir sawirka"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Kudar Sawir Cusub (Upload Photo)"
      >
        <form onSubmit={handleAddPhoto} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-chalk mb-1">
              Dooro Sawirka (Device Upload)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center border-2 border-dashed border-club-border rounded-xl p-4 cursor-pointer hover:border-gold/50 bg-pitch-deep transition-all"
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-40 rounded-lg object-contain mb-2"
                />
              ) : (
                <>
                  <UploadCloud className="h-8 w-8 text-gold mb-1" />
                  <span className="text-xs text-chalk font-semibold">
                    Guji si aad sawir uga soo doorato taleefanka/kombiyuutarka
                  </span>
                  <span className="text-[0.625rem] text-chalk-dim">
                    PNG, JPG, WEBP (Max 5MB)
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <span className="text-[0.625rem] font-bold uppercase text-chalk-dim bg-surface px-2">
              Ama geli URL
            </span>
          </div>

          <TextField
            label="URL-ka Sawirka (Direct Image URL)"
            value={manualUrl}
            onChange={(e) => {
              setManualUrl(e.target.value)
              if (e.target.value) {
                setSelectedFile(null)
                if (previewUrl && previewUrl.startsWith('blob:')) {
                  URL.revokeObjectURL(previewUrl)
                }
                setPreviewUrl('')
              }
            }}
            placeholder="https://..."
          />

          <TextField
            label="Sharaxaadda Sawirka (Caption)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="e.g. Tababarkii maanta ee garoonka weyn"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setIsModalOpen(false)}
            >
              Ka Noqo
            </Button>
            <Button
              variant="primary"
              type="submit"
              busy={isUploading}
              disabled={!selectedFile && !manualUrl.trim()}
            >
              <ImageIcon className="h-4 w-4" />
              <span>{isUploading ? 'Gelinya...' : 'Keydi Sawirka'}</span>
            </Button>
          </div>
        </form>
      </Dialog>

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
