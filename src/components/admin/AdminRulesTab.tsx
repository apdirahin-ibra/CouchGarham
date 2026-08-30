import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  Bell,
  BookOpen,
  Mic,
  Play,
  RefreshCw,
  Save,
  Square,
  Trash2,
  Volume2,
} from 'lucide-react'

import { useAuth } from '../../lib/auth-client'
import {
  deleteVoiceAnnouncementFn,
  getClubSettingsFn,
  updateClubSettingsFn,
  uploadVoiceAnnouncementFn,
} from '../../server/api'
import { Button, SectionTitle, TicketCard } from '../ui'
import { useToast } from '../ui/toast-context'

export function AdminRulesTab() {
  const { token } = useAuth()
  const { notify } = useToast()

  const [announcementText, setAnnouncementText] = useState('')
  const [announcementAudioPath, setAnnouncementAudioPath] = useState<
    string | null
  >(null)
  const [rulesText, setRulesText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false)
  const [isSavingRules, setIsSavingRules] = useState(false)

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null)
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null)
  const [isUploadingAudio, setIsUploadingAudio] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<any>(null)

  const loadSettings = useCallback(async () => {
    if (!token) return
    setIsLoading(true)
    setLoadError('')
    try {
      const settings = await getClubSettingsFn({
        data: { sessionToken: token },
      })
      if (settings) {
        setAnnouncementText(settings.announcementText || '')
        setAnnouncementAudioPath(settings.announcementAudioPath || null)
        setRulesText(settings.rulesText || '')
      }
    } catch (err: any) {
      setLoadError(err?.message || 'Qalad ayaa dhacay soo dejinta shuruucda')
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  // Component unmount cleanup (M5-03)
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'inactive'
      ) {
        mediaRecorderRef.current.stop()
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (audioPreviewUrl && audioPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioPreviewUrl)
      }
    }
  }, [audioPreviewUrl])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioStreamRef.current = stream
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || 'audio/webm',
        })
        setRecordedAudioBlob(audioBlob)
        if (audioPreviewUrl && audioPreviewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(audioPreviewUrl)
        }
        setAudioPreviewUrl(URL.createObjectURL(audioBlob))
        stream.getTracks().forEach((track) => track.stop())
        audioStreamRef.current = null
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingSeconds(0)
      timerRef.current = setInterval(() => {
        setRecordingSeconds((sec) => sec + 1)
      }, 1000)
    } catch {
      notify(
        'Fadlan oggolow cod-duubaha mikrofoonka (Microphone permission needed)',
        'danger',
      )
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      clearInterval(timerRef.current)
    }
  }

  const handleUploadAudio = async () => {
    if (!recordedAudioBlob || !token) return
    setIsUploadingAudio(true)

    try {
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string
          const base64 = result.split(',')[1] || ''
          resolve(base64)
        }
        reader.onerror = reject
        reader.readAsDataURL(recordedAudioBlob)
      })

      const base64Audio = await base64Promise
      const mimeType = recordedAudioBlob.type || 'audio/webm'

      const { publicUrl } = await uploadVoiceAnnouncementFn({
        data: {
          sessionToken: token,
          base64Audio,
          mimeType,
        },
      })

      setAnnouncementAudioPath(publicUrl)
      setRecordedAudioBlob(null)
      if (audioPreviewUrl && audioPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioPreviewUrl)
      }
      setAudioPreviewUrl(null)
      notify(
        'Codka ogeysiiska si guul leh ayaa loo geliyay Storage!',
        'success',
      )
    } catch (err: any) {
      notify(err?.message || 'Qalad ayaa dhacay gelinta codka', 'danger')
    } finally {
      setIsUploadingAudio(false)
    }
  }

  const handleDeleteAudio = async () => {
    if (!token) return
    try {
      await deleteVoiceAnnouncementFn({
        data: { sessionToken: token },
      })
      setAnnouncementAudioPath(null)
      setRecordedAudioBlob(null)
      if (audioPreviewUrl && audioPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioPreviewUrl)
      }
      setAudioPreviewUrl(null)
      notify('Codkii ogeysiiska waa la tirtiray', 'neutral')
    } catch (err: any) {
      notify(err?.message || 'Qalad ayaa dhacay tirtirista', 'danger')
    }
  }

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setIsSavingAnnouncement(true)

    try {
      await updateClubSettingsFn({
        data: {
          sessionToken: token,
          announcementText: announcementText.trim(),
        },
      })
      notify('Ogeysiiska tooska ah ee kooxda waa la keydiyay!', 'success')
    } catch (err: any) {
      notify(err?.message || 'Qalad ayaa dhacay keydinta ogeysiiska', 'danger')
    } finally {
      setIsSavingAnnouncement(false)
    }
  }

  const handleSaveRules = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setIsSavingRules(true)

    try {
      await updateClubSettingsFn({
        data: {
          sessionToken: token,
          rulesText: rulesText.trim(),
        },
      })
      notify('Shuruucda kooxda waa la keydiyay!', 'success')
    } catch (err: any) {
      notify(err?.message || 'Qalad ayaa dhacay keydinta shuruucda', 'danger')
    } finally {
      setIsSavingRules(false)
    }
  }

  return (
    <div className="space-y-6 pb-16">
      <div>
        <SectionTitle eyebrow="SHARCIYADA & OGEYSIISYADA" as="h2">
          Shuruucda & Ogeysiiska Kooxda
        </SectionTitle>
        <p className="text-xs text-chalk-dim">
          Maamul ogeysiiska tooska ah ee shaashadda hore, codka tababaraha, iyo
          xeerarka kooxda
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-club-border bg-surface text-gold">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" />
          <span>Soo dejinaya shuruucda kooxda...</span>
        </div>
      ) : loadError ? (
        <div className="rounded-xl border border-danger/40 bg-surface p-6 text-center space-y-3">
          <AlertCircle className="h-6 w-6 text-danger mx-auto" />
          <p className="text-sm text-danger m-0">{loadError}</p>
          <Button
            type="button"
            variant="secondary"
            className="text-xs"
            onClick={loadSettings}
          >
            Dib u tijaabi
          </Button>
        </div>
      ) : (
        <>
          <TicketCard className="p-4 space-y-4 border-gold/40">
            <div className="flex items-center gap-2 text-gold">
              <Bell className="h-4 w-4" />
              <SectionTitle
                eyebrow="OGEYSIISKA TOOSKA AH (LIVE BANNER)"
                as="h3"
              >
                Ogeysiiska Guud ee Dashboard-ka
              </SectionTitle>
            </div>

            <form onSubmit={handleSaveAnnouncement} className="space-y-3">
              <textarea
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="Qor ogeysiiska tooska ah ee ciyaartooydu ku arki doonaan shaashadda hore..."
                rows={3}
                className="ui-input text-sm"
              />

              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  busy={isSavingAnnouncement}
                  className="text-xs py-2 px-4 gap-1.5"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Keydi Qoraalka Ogeysiiska</span>
                </Button>
              </div>
            </form>

            <div className="border-t border-club-border pt-4 space-y-3">
              <div className="flex items-center gap-2 text-gold">
                <Volume2 className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Codka Tababaraha (Coach Voice Note)
                </span>
              </div>

              {announcementAudioPath ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-lg border border-gold/30 bg-pitch-deep p-3">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-5 w-5 text-gold" />
                    <div>
                      <span className="text-xs font-bold text-chalk block">
                        Codkii Tababaraha Waa Diyaar
                      </span>
                      <audio
                        src={announcementAudioPath}
                        controls
                        className="mt-1 h-8 max-w-[240px]"
                      />
                    </div>
                  </div>

                  <Button
                    variant="danger"
                    className="text-xs py-1.5 px-3 gap-1"
                    onClick={handleDeleteAudio}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Tirtir Codka</span>
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border border-club-border bg-pitch-deep p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isRecording ? (
                        <span className="flex h-3 w-3 rounded-full bg-danger animate-ping" />
                      ) : (
                        <Mic className="h-4 w-4 text-gold" />
                      )}
                      <span className="text-xs font-semibold text-chalk">
                        {isRecording
                          ? `Duubaya codka... (${recordingSeconds}s)`
                          : recordedAudioBlob
                            ? 'Codkii waa la duubay. Dhageyso ama geli.'
                            : 'Duub cod cusub oo ciyaartooyda loogu talagalay'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isRecording ? (
                        <Button
                          variant="danger"
                          onClick={stopRecording}
                          className="text-xs py-1.5 px-3 gap-1"
                        >
                          <Square className="h-3.5 w-3.5" />
                          <span>Jooji Duubista</span>
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          onClick={startRecording}
                          className="text-xs py-1.5 px-3 gap-1"
                        >
                          <Mic className="h-3.5 w-3.5" />
                          <span>Bilow Duubis</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {audioPreviewUrl && !isRecording ? (
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-club-border">
                      <audio
                        src={audioPreviewUrl}
                        controls
                        className="h-8 max-w-[220px]"
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setRecordedAudioBlob(null)
                            if (
                              audioPreviewUrl &&
                              audioPreviewUrl.startsWith('blob:')
                            ) {
                              URL.revokeObjectURL(audioPreviewUrl)
                            }
                            setAudioPreviewUrl(null)
                          }}
                          className="text-xs py-1 px-2"
                        >
                          Ka Noqo
                        </Button>
                        <Button
                          variant="primary"
                          onClick={handleUploadAudio}
                          busy={isUploadingAudio}
                          className="text-xs py-1.5 px-3 gap-1"
                        >
                          <Play className="h-3.5 w-3.5" />
                          <span>Geli Codka</span>
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </TicketCard>

          <TicketCard className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-gold">
              <BookOpen className="h-4 w-4" />
              <SectionTitle eyebrow="XEERARKA & ANSHAXA KOOXDA" as="h3">
                Shuruucda Rasmiga ah ee Kooxda
              </SectionTitle>
            </div>

            <form onSubmit={handleSaveRules} className="space-y-3">
              <textarea
                value={rulesText}
                onChange={(e) => setRulesText(e.target.value)}
                placeholder="Qor dhammaan shuruucda kooxda..."
                rows={8}
                className="ui-input text-sm leading-relaxed"
              />

              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  busy={isSavingRules}
                  className="text-xs py-2 px-4 gap-1.5"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Keydi Shuruucda</span>
                </Button>
              </div>
            </form>
          </TicketCard>
        </>
      )}
    </div>
  )
}
