"use client"

import { useCallback, useState, useEffect } from "react"
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useTracks,
  useParticipants,
  useLocalParticipant,
  VideoTrack,
} from "@livekit/components-react"
import { Track, LocalParticipant, RemoteParticipant } from "livekit-client"
import { motion, AnimatePresence } from "framer-motion"
import {
  Mic, MicOff, Video, VideoOff, Monitor, MessageSquare,
  PhoneOff, Users, Copy, Check, Pin, PinOff, Maximize2,
} from "lucide-react"
import { ChatPanel } from "@/components/chat-panel"
import { NetworkWidget } from "@/components/network-widget"

interface RoomProps {
  userName: string
  roomId: string
  token: string
  onLeave: () => void
}

export function Room({ userName, roomId, token, onLeave }: RoomProps) {
  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || ""
  return (
    <LiveKitRoom
      token={token}
      serverUrl={livekitUrl}
      connect={true}
      audio={true}
      video={true}
      onDisconnected={onLeave}
      style={{ height: "100vh" }}
    >
      <RoomAudioRenderer />
      <RoomUI userName={userName} roomId={roomId} onLeave={onLeave} />
    </LiveKitRoom>
  )
}

function RoomUI({ userName, roomId, onLeave }: { userName: string; roomId: string; onLeave: () => void }) {
  const [chatOpen, setChatOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [pinnedId, setPinnedId] = useState<string | null>(null)
  const [controlsVisible, setControlsVisible] = useState(true)
  const { localParticipant } = useLocalParticipant()
  const participants = useParticipants()

  const micEnabled = localParticipant.isMicrophoneEnabled
  const camEnabled = localParticipant.isCameraEnabled
  const screenEnabled = localParticipant.isScreenShareEnabled

  // Auto-hide controls on mobile after 3s
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    const reset = () => {
      setControlsVisible(true)
      clearTimeout(timeout)
      timeout = setTimeout(() => setControlsVisible(false), 4000)
    }
    window.addEventListener("touchstart", reset)
    window.addEventListener("mousemove", reset)
    reset()
    return () => {
      window.removeEventListener("touchstart", reset)
      window.removeEventListener("mousemove", reset)
      clearTimeout(timeout)
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = useCallback((s: number) => {
    const h = String(Math.floor(s / 3600)).padStart(2, "0")
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0")
    const sec = String(s % 60).padStart(2, "0")
    return `${h}:${m}:${sec}`
  }, [])

  const handleCopyLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    navigator.clipboard.writeText(`${origin}?room=${roomId}`).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col h-screen grid-bg">
      {/* Top bar - hidden on mobile when controls are hidden */}
      <AnimatePresence>
        {controlsVisible && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <NetworkWidget />
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.01)]">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <motion.div
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-1.5 h-1.5 bg-neon"
                  />
                  <span className="text-[10px] font-mono text-neon uppercase tracking-[0.2em] hidden sm:inline">Live Session</span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">{formatTime(elapsedSeconds)}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Users size={11} strokeWidth={1.5} className="text-chrome/50" />
                  <span className="text-[10px] font-mono text-chrome/50">{participants.length}</span>
                </div>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-2 py-1 border border-[rgba(255,255,255,0.08)] text-chrome/50 hover:text-neon hover:border-neon/30 transition-colors"
                >
                  {copied ? <Check size={10} /> : <Copy size={10} />}
                  <span className="text-[9px] font-mono uppercase tracking-widest hidden sm:inline">
                    {copied ? "Copiado!" : roomId}
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video grid */}
      <div className="flex-1 overflow-hidden">
        <VideoGrid pinnedId={pinnedId} onPin={setPinnedId} />
      </div>

      {/* Controls - auto-hide on mobile */}
      <AnimatePresence>
        {controlsVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex items-center justify-center py-3 px-2 border-t border-[rgba(255,255,255,0.08)] bg-background/80 backdrop-blur-sm"
          >
            <div className="flex items-center gap-1 px-3 py-2 glass flex-wrap justify-center">
              <ControlBtn active={micEnabled} onClick={() => localParticipant.setMicrophoneEnabled(!micEnabled)} label="Microfone">
                {micEnabled ? <Mic size={18} strokeWidth={1.5} /> : <MicOff size={18} strokeWidth={1.5} />}
              </ControlBtn>

              <ControlBtn active={camEnabled} onClick={() => localParticipant.setCameraEnabled(!camEnabled)} label="Câmera">
                {camEnabled ? <Video size={18} strokeWidth={1.5} /> : <VideoOff size={18} strokeWidth={1.5} />}
              </ControlBtn>

              <ControlBtn active={screenEnabled} onClick={() => localParticipant.setScreenShareEnabled(!screenEnabled)} label="Tela">
                <Monitor size={18} strokeWidth={1.5} />
              </ControlBtn>

              <div className="w-px h-6 bg-[rgba(255,255,255,0.08)] mx-1" />

              <ControlBtn onClick={() => setChatOpen(!chatOpen)} label="Chat">
                <MessageSquare size={18} strokeWidth={1.5} />
              </ControlBtn>

              {pinnedId && (
                <ControlBtn onClick={() => setPinnedId(null)} label="Desafixar">
                  <PinOff size={18} strokeWidth={1.5} />
                </ControlBtn>
              )}

              <div className="w-px h-6 bg-[rgba(255,255,255,0.08)] mx-1" />

              <ControlBtn danger onClick={onLeave} label="Sair">
                <PhoneOff size={18} strokeWidth={1.5} />
              </ControlBtn>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} roomId={roomId} userName={userName} />
    </div>
  )
}

function VideoGrid({ pinnedId, onPin }: { pinnedId: string | null; onPin: (id: string | null) => void }) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  )

  // Auto-pin screen share
  const screenTrack = tracks.find((t) => t.source === Track.Source.ScreenShare)
  const effectivePinnedId = pinnedId || (screenTrack ? screenTrack.participant.sid + screenTrack.source : null)

  if (effectivePinnedId) {
    const pinned = tracks.find((t) => t.participant.sid + t.source === effectivePinnedId)
    const others = tracks.filter((t) => t.participant.sid + t.source !== effectivePinnedId)

    return (
      <div className="flex h-full gap-0">
        {/* Main pinned view */}
        <div className="flex-1 relative">
          {pinned && <ParticipantTile track={pinned} index={0} pinned onPin={onPin} />}
        </div>

        {/* Side strip */}
        {others.length > 0 && (
          <div className="w-32 sm:w-44 flex flex-col border-l border-[rgba(255,255,255,0.08)] overflow-y-auto">
            {others.map((track, i) => (
              <div key={track.participant.sid + track.source} className="flex-shrink-0" style={{ height: `${100 / Math.min(others.length, 4)}%`, minHeight: 80 }}>
                <ParticipantTile track={track} index={i + 1} onPin={onPin} />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Normal grid
  const count = tracks.length
  const cols = count <= 1 ? "grid-cols-1" : count <= 2 ? "grid-cols-1 sm:grid-cols-2" : count <= 4 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"

  return (
    <div className={`grid ${cols} h-full gap-0`}>
      {tracks.map((track, i) => (
        <ParticipantTile key={track.participant.sid + track.source} track={track} index={i} onPin={onPin} />
      ))}
    </div>
  )
}

function ParticipantTile({
  track, index, pinned = false, onPin,
}: {
  track: any; index: number; pinned?: boolean; onPin: (id: string | null) => void
}) {
  const participant = track.participant as LocalParticipant | RemoteParticipant
  const name = participant.name || participant.identity || "Unknown"
  const isSpeaking = participant.isSpeaking
  const isLocal = track.participant instanceof LocalParticipant
  const trackId = track.participant.sid + track.source
  const isScreen = track.source === Track.Source.ScreenShare

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`relative overflow-hidden border bg-card scanlines h-full ${
        isSpeaking && !pinned ? "border-neon neon-glow" : "border-[rgba(255,255,255,0.08)]"
      }`}
    >
      {track.publication?.isSubscribed || isLocal ? (
        <VideoTrack trackRef={track} className="w-full h-full object-cover" />
      ) : (
        <div className="flex items-center justify-center w-full h-full bg-[#050505]">
          <div className="flex flex-col items-center gap-2">
            <motion.div
              animate={isSpeaking ? { scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className={`flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 border text-base sm:text-lg font-mono uppercase tracking-widest ${
                isSpeaking ? "border-neon text-neon" : "border-[rgba(255,255,255,0.15)] text-chrome"
              }`}
            >
              {name.slice(0, 2)}
            </motion.div>
            <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
              {isLocal ? "YOU" : name}
            </span>
          </div>
        </div>
      )}

      {/* Speaking indicator */}
      {isSpeaking && (
        <div className="absolute top-2 left-2 flex items-center gap-1">
          <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-neon" />
          <span className="text-[9px] font-mono text-neon uppercase tracking-widest neon-text hidden sm:inline">Live</span>
        </div>
      )}

      {/* Pin button - tap/hover to show */}
      <button
        onClick={() => onPin(pinned ? null : trackId)}
        className="absolute top-2 right-2 flex items-center justify-center w-7 h-7 bg-black/60 border border-[rgba(255,255,255,0.15)] text-chrome/70 hover:text-neon hover:border-neon/40 transition-colors opacity-0 hover:opacity-100 focus:opacity-100 active:opacity-100"
        aria-label={pinned ? "Desafixar" : "Fixar"}
      >
        {pinned ? <PinOff size={12} /> : <Pin size={12} />}
      </button>

      {/* Name tag */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-2 py-1 bg-[rgba(0,0,0,0.7)]">
        <span className="text-[9px] sm:text-[10px] font-mono text-chrome truncate">
          {isLocal ? `${name} (você)` : name}
        </span>
        {isScreen && <span className="text-[9px] font-mono text-neon uppercase">Tela</span>}
        {pinned && <Maximize2 size={10} className="text-neon ml-1 flex-shrink-0" />}
      </div>
    </motion.div>
  )
}

function ControlBtn({
  active, danger = false, onClick, children, label,
}: {
  active?: boolean; danger?: boolean; onClick: () => void; children: React.ReactNode; label: string
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: 1.05 }}
      onClick={onClick}
      aria-label={label}
      className={`relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 glass transition-all ${
        danger
          ? "border-danger/40 text-danger hover:bg-danger/10 hover:border-danger/60"
          : active
          ? "border-neon/30 text-neon hover:bg-neon/5"
          : "border-[rgba(255,255,255,0.08)] text-chrome/50 hover:text-chrome hover:bg-[rgba(255,255,255,0.04)]"
      }`}
    >
      {children}
      {active && !danger && (
        <motion.div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-neon" />
      )}
    </motion.button>
  )
}
