"use client"

import { useCallback, useState } from "react"
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useTracks,
  useParticipants,
  useLocalParticipant,
  VideoTrack,
  useRoomContext,
} from "@livekit/components-react"
import { Track, LocalParticipant, RemoteParticipant } from "livekit-client"
import { motion, AnimatePresence } from "framer-motion"
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

  // Timer
  useState(() => {
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000)
    return () => clearInterval(interval)
  })

  const handleCopyLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    navigator.clipboard.writeText(`${origin}?room=${roomId}`).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col h-screen grid-bg">
      <NetworkWidget />

      {/* Session info bar */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.01)]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-1.5 h-1.5 bg-neon"
            />
            <span className="text-[10px] font-mono text-neon uppercase tracking-[0.2em]">Live Session</span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">{formatTime(elapsedSeconds)}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Users size={11} strokeWidth={1.5} className="text-chrome/50" />
            <span className="text-[10px] font-mono text-chrome/50">{participants.length}</span>
          </div>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-2 py-1 border border-[rgba(255,255,255,0.08)] text-chrome/50 hover:text-neon hover:border-neon/30 transition-colors"
          >
            {copied ? <Check size={10} /> : <Copy size={10} />}
            <span className="text-[9px] font-mono uppercase tracking-widest">
              {copied ? "Copiado!" : roomId}
            </span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-2 overflow-hidden">
            <VideoGrid />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center py-3 border-t border-[rgba(255,255,255,0.08)]">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex items-center gap-1 px-3 py-2 glass"
            >
              <ControlBtn
                active={micEnabled}
                onClick={() => localParticipant.setMicrophoneEnabled(!micEnabled)}
                label="Microfone"
              >
                {micEnabled ? <Mic size={18} strokeWidth={1.5} /> : <MicOff size={18} strokeWidth={1.5} />}
              </ControlBtn>

              <ControlBtn
                active={camEnabled}
                onClick={() => localParticipant.setCameraEnabled(!camEnabled)}
                label="Câmera"
              >
                {camEnabled ? <Video size={18} strokeWidth={1.5} /> : <VideoOff size={18} strokeWidth={1.5} />}
              </ControlBtn>

              <ControlBtn
                active={screenEnabled}
                onClick={() => localParticipant.setScreenShareEnabled(!screenEnabled)}
                label="Tela"
              >
                <Monitor size={18} strokeWidth={1.5} />
              </ControlBtn>

              <div className="w-px h-6 bg-[rgba(255,255,255,0.08)] mx-1" />

              <ControlBtn onClick={() => setChatOpen(!chatOpen)} label="Chat">
                <MessageSquare size={18} strokeWidth={1.5} />
              </ControlBtn>

              <div className="w-px h-6 bg-[rgba(255,255,255,0.08)] mx-1" />

              <ControlBtn danger onClick={onLeave} label="Sair">
                <PhoneOff size={18} strokeWidth={1.5} />
              </ControlBtn>
            </motion.div>
          </div>
        </div>
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
  const cols = count <= 1 ? "grid-cols-1" : count <= 2 ? "grid-cols-2" : count <= 4 ? "grid-cols-2" : "grid-cols-3"

  return (
    <div className={`grid ${cols} h-full gap-0`}>
      {tracks.map((track, i) => (
        <ParticipantTile key={track.participant.sid + track.source} track={track} index={i} />
      ))}
    </div>
  )
}

function ParticipantTile({ track, index }: { track: any; index: number }) {
  const participant = track.participant as LocalParticipant | RemoteParticipant
  const name = participant.name || participant.identity || "Unknown"
  const isSpeaking = participant.isSpeaking
  const isLocal = track.participant instanceof LocalParticipant

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
        <div className="flex items-center justify-center aspect-video bg-[#050505]">
          <div className="flex flex-col items-center gap-2">
            <motion.div
              animate={isSpeaking ? { scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className={`flex items-center justify-center w-16 h-16 border text-lg font-mono uppercase tracking-widest ${
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

      {/* Speaking indicator */}
      {isSpeaking && (
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="w-1.5 h-1.5 bg-neon"
          />
          <span className="text-[9px] font-mono text-neon uppercase tracking-widest neon-text">Live</span>
        </div>
      )}

      {/* Name tag */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-2 py-1 bg-[rgba(0,0,0,0.7)]">
        <span className="text-[10px] font-mono text-chrome truncate">{isLocal ? `${name} (você)` : name}</span>
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
      className={`relative flex items-center justify-center w-12 h-12 glass transition-all ${
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
