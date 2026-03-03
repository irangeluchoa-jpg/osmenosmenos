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
import { motion } from "framer-motion"
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
  const { localParticipant } = useLocalParticipant()
  const participants = useParticipants()

  const micEnabled = localParticipant.isMicrophoneEnabled
  const camEnabled = localParticipant.isCameraEnabled
  const screenEnabled = localParticipant.isScreenShareEnabled

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
      {/* Top bar */}
      <NetworkWidget />
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.01)]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-1.5 h-1.5 bg-neon"
            />
            <span className="text-[10px] font-mono text-neon uppercase tracking-[0.2em]">Live</span>
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
            className="flex items-center gap-1.5 px-2 py-1 border border-[rgba(255,255,255,0.08)] text-chrome/50 hover:text-neon hover:border-neon/30 transition-colors touch-manipulation"
          >
            {copied ? <Check size={10} /> : <Copy size={10} />}
            <span className="text-[9px] font-mono uppercase tracking-widest">
              {copied ? "Copiado!" : roomId}
            </span>
          </button>
        </div>
      </div>

      {/* Video grid - takes remaining space */}
      <div className="flex-1 overflow-hidden min-h-0">
        <VideoGrid pinnedId={pinnedId} onPin={setPinnedId} />
      </div>

      {/* Controls - sempre visíveis, nunca somem */}
      <div className="flex-shrink-0 flex items-center justify-center py-4 px-2 border-t border-[rgba(255,255,255,0.08)] bg-[#0a0a0a]">
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <ControlBtn active={micEnabled} onClick={() => localParticipant.setMicrophoneEnabled(!micEnabled)} label="Microfone">
            {micEnabled ? <Mic size={20} strokeWidth={1.5} /> : <MicOff size={20} strokeWidth={1.5} />}
          </ControlBtn>

          <ControlBtn active={camEnabled} onClick={() => localParticipant.setCameraEnabled(!camEnabled)} label="Câmera">
            {camEnabled ? <Video size={20} strokeWidth={1.5} /> : <VideoOff size={20} strokeWidth={1.5} />}
          </ControlBtn>

          <ControlBtn active={screenEnabled} onClick={() => localParticipant.setScreenShareEnabled(!screenEnabled)} label="Tela">
            <Monitor size={20} strokeWidth={1.5} />
          </ControlBtn>

          <div className="w-px h-8 bg-[rgba(255,255,255,0.08)]" />

          <ControlBtn onClick={() => setChatOpen(!chatOpen)} label="Chat">
            <MessageSquare size={20} strokeWidth={1.5} />
          </ControlBtn>

          {pinnedId && (
            <ControlBtn onClick={() => setPinnedId(null)} label="Desafixar">
              <PinOff size={20} strokeWidth={1.5} />
            </ControlBtn>
          )}

          <div className="w-px h-8 bg-[rgba(255,255,255,0.08)]" />

          <ControlBtn danger onClick={onLeave} label="Sair">
            <PhoneOff size={20} strokeWidth={1.5} />
          </ControlBtn>
        </div>
      </div>

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

  const screenTrack = tracks.find((t) => t.source === Track.Source.ScreenShare)
  const effectivePinnedId = pinnedId || (screenTrack ? screenTrack.participant.sid + screenTrack.source : null)

  if (effectivePinnedId) {
    const pinned = tracks.find((t) => t.participant.sid + t.source === effectivePinnedId)
    const others = tracks.filter((t) => t.participant.sid + t.source !== effectivePinnedId)

    return (
      <div className="flex h-full">
        <div className="flex-1 min-w-0">
          {pinned && <ParticipantTile track={pinned} index={0} pinned onPin={onPin} />}
        </div>
        {others.length > 0 && (
          <div className="w-24 sm:w-36 flex flex-col border-l border-[rgba(255,255,255,0.08)] overflow-y-auto">
            {others.map((track, i) => (
              <div key={track.participant.sid + track.source} style={{ height: `${100 / Math.min(others.length, 4)}%`, minHeight: 72 }}>
                <ParticipantTile track={track} index={i + 1} onPin={onPin} />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const count = tracks.length
  const cols =
    count <= 1 ? "grid-cols-1" :
    count <= 2 ? "grid-cols-2" :
    count <= 4 ? "grid-cols-2" :
    "grid-cols-3"

  return (
    <div className={`grid ${cols} h-full`}>
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
              className={`flex items-center justify-center w-12 h-12 border text-base font-mono uppercase tracking-widest ${
                isSpeaking ? "border-neon text-neon" : "border-[rgba(255,255,255,0.15)] text-chrome"
              }`}
            >
              {name.slice(0, 2)}
            </motion.div>
            <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
              {isLocal ? "YOU" : name}
            </span>
          </div>
        </div>
      )}

      {isSpeaking && (
        <div className="absolute top-2 left-2 flex items-center gap-1">
          <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-neon" />
        </div>
      )}

      {/* Pin button - sempre visível */}
      <button
        onClick={() => onPin(pinned ? null : trackId)}
        className="absolute top-2 right-2 flex items-center justify-center w-8 h-8 bg-black/70 border border-[rgba(255,255,255,0.2)] text-chrome hover:text-neon hover:border-neon/40 transition-colors touch-manipulation"
        aria-label={pinned ? "Desafixar" : "Fixar"}
      >
        {pinned ? <PinOff size={13} /> : <Pin size={13} />}
      </button>

      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-2 py-1 bg-[rgba(0,0,0,0.7)]">
        <span className="text-[9px] font-mono text-chrome truncate">
          {isLocal ? `${name} (você)` : name}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isScreen && <span className="text-[9px] font-mono text-neon uppercase">Tela</span>}
          {pinned && <Maximize2 size={10} className="text-neon" />}
        </div>
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
    <button
      onClick={onClick}
      aria-label={label}
      className={`relative flex items-center justify-center w-14 h-14 border transition-all touch-manipulation select-none ${
        danger
          ? "border-danger/40 bg-danger/5 text-danger active:bg-danger/20"
          : active
          ? "border-neon/40 bg-neon/5 text-neon active:bg-neon/20"
          : "border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] text-chrome/60 active:bg-[rgba(255,255,255,0.08)]"
      }`}
    >
      {children}
      {active && !danger && (
        <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-neon" />
      )}
    </button>
  )
}
