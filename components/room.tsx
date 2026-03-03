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
import { Track, LocalParticipant } from "livekit-client"
import { motion } from "framer-motion"
import { Mic, MicOff, Video, VideoOff, Monitor, MessageSquare, PhoneOff, Users, Copy, Check } from "lucide-react"
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
      style={{ height: "100dvh" }}
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
  const { localParticipant } = useLocalParticipant()
  const participants = useParticipants()

  const micEnabled = localParticipant.isMicrophoneEnabled
  const camEnabled = localParticipant.isCameraEnabled
  const screenEnabled = localParticipant.isScreenShareEnabled

  const formatTime = useCallback((s: number) => {
    const h = String(Math.floor(s / 3600)).padStart(2, "0")
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0")
    const sec = String(s % 60).padStart(2, "0")
    return `${h}:${m}:${sec}`
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const handleCopyLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    navigator.clipboard.writeText(`${origin}?room=${roomId}`).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col grid-bg" style={{ height: "100dvh" }}>
      <NetworkWidget />

      {/* Info bar */}
      <div className="flex items-center justify-between px-3 py-1 border-b border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.01)] shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-1.5 h-1.5 bg-neon"
            />
            <span className="text-[10px] font-mono text-neon uppercase tracking-[0.2em]">LIVE</span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">{formatTime(elapsedSeconds)}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Users size={11} strokeWidth={1.5} className="text-chrome/50" />
            <span className="text-[10px] font-mono text-chrome/50">{participants.length}</span>
          </div>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1 px-2 py-0.5 border border-[rgba(255,255,255,0.08)] text-chrome/50 hover:text-neon hover:border-neon/30 transition-colors"
          >
            {copied ? <Check size={10} /> : <Copy size={10} />}
            <span className="text-[9px] font-mono uppercase tracking-widest hidden sm:inline">
              {copied ? "Copiado!" : roomId}
            </span>
            <span className="text-[9px] font-mono uppercase tracking-widest sm:hidden">
              {copied ? "OK" : "Link"}
            </span>
          </button>
        </div>
      </div>

      {/* Video grid — flex-1 so it fills remaining space */}
      <div className="flex-1 overflow-hidden p-1">
        <VideoGrid />
      </div>

      {/* Controls — fixed height, always visible */}
      <div className="shrink-0 flex items-center justify-center py-2 border-t border-[rgba(255,255,255,0.08)] bg-background/80 backdrop-blur">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-1 px-2 py-1.5 glass"
        >
          <ControlBtn active={micEnabled} onClick={() => localParticipant.setMicrophoneEnabled(!micEnabled)} label="Mic">
            {micEnabled ? <Mic size={16} strokeWidth={1.5} /> : <MicOff size={16} strokeWidth={1.5} />}
          </ControlBtn>

          <ControlBtn active={camEnabled} onClick={() => localParticipant.setCameraEnabled(!camEnabled)} label="Cam">
            {camEnabled ? <Video size={16} strokeWidth={1.5} /> : <VideoOff size={16} strokeWidth={1.5} />}
          </ControlBtn>

          <ControlBtn active={screenEnabled} onClick={() => localParticipant.setScreenShareEnabled(!screenEnabled)} label="Tela">
            <Monitor size={16} strokeWidth={1.5} />
          </ControlBtn>

          <div className="w-px h-5 bg-[rgba(255,255,255,0.08)] mx-0.5" />

          <ControlBtn onClick={() => setChatOpen(!chatOpen)} label="Chat">
            <MessageSquare size={16} strokeWidth={1.5} />
          </ControlBtn>

          <div className="w-px h-5 bg-[rgba(255,255,255,0.08)] mx-0.5" />

          <ControlBtn danger onClick={onLeave} label="Sair">
            <PhoneOff size={16} strokeWidth={1.5} />
          </ControlBtn>
        </motion.div>
      </div>

      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} roomId={roomId} userName={userName} />
    </div>
  )
}

function VideoGrid() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  )

  const count = tracks.length

  // Mobile: always stack vertically (grid-cols-1)
  // Desktop: side by side for 2, 2x2 for 4, etc.
  const cols =
    count <= 1
      ? "grid-cols-1"
      : count === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : count <= 4
      ? "grid-cols-2"
      : "grid-cols-2 sm:grid-cols-3"

  return (
    <div className={`grid ${cols} h-full gap-1`}>
      {tracks.map((track, i) => (
        <ParticipantTile key={track.participant.sid + track.source} track={track} index={i} />
      ))}
    </div>
  )
}

function ParticipantTile({ track, index }: { track: any; index: number }) {
  const participant = track.participant
  const name = participant.name || participant.identity || "Unknown"
  const isSpeaking = participant.isSpeaking
  const isLocal = participant instanceof LocalParticipant

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`relative overflow-hidden border bg-card scanlines ${
        isSpeaking ? "border-neon neon-glow" : "border-[rgba(255,255,255,0.08)]"
      }`}
    >
      {track.publication?.isSubscribed || isLocal ? (
        <VideoTrack trackRef={track} className="w-full h-full object-cover" />
      ) : (
        <div className="flex items-center justify-center w-full h-full bg-[#050505] min-h-[120px]">
          <div className="flex flex-col items-center gap-2">
            <motion.div
              animate={isSpeaking ? { scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className={`flex items-center justify-center w-14 h-14 border text-base font-mono uppercase tracking-widest ${
                isSpeaking ? "border-neon text-neon" : "border-[rgba(255,255,255,0.15)] text-chrome"
              }`}
            >
              {name.slice(0, 2)}
            </motion.div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
              {isLocal ? "YOU" : name}
            </span>
          </div>
        </div>
      )}

      {isSpeaking && (
        <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="w-1.5 h-1.5 bg-neon"
          />
          <span className="text-[9px] font-mono text-neon uppercase tracking-widest neon-text">Live</span>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-2 py-0.5 bg-[rgba(0,0,0,0.7)]">
        <span className="text-[9px] font-mono text-chrome truncate">{isLocal ? `${name} (você)` : name}</span>
        {track.source === Track.Source.ScreenShare && (
          <span className="text-[9px] font-mono text-neon uppercase">Tela</span>
        )}
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
      className={`relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 glass transition-all ${
        danger
          ? "border-danger/40 text-danger hover:bg-danger/10"
          : active
          ? "border-neon/30 text-neon hover:bg-neon/5"
          : "border-[rgba(255,255,255,0.08)] text-chrome/50 hover:text-chrome"
      }`}
    >
      {children}
      {active && !danger && (
        <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-neon" />
      )}
    </motion.button>
  )
}
