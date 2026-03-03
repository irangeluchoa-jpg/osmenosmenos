"use client"

import { motion } from "framer-motion"
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MessageSquare,
  PhoneOff,
} from "lucide-react"

interface ControlsProps {
  micOn: boolean
  camOn: boolean
  screenSharing: boolean
  onToggleMic: () => void
  onToggleCam: () => void
  onToggleScreen: () => void
  onToggleChat: () => void
  onLeave: () => void
}

function ControlButton({
  active,
  danger = false,
  onClick,
  children,
  label,
}: {
  active?: boolean
  danger?: boolean
  onClick: () => void
  children: React.ReactNode
  label: string
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
      {/* Active indicator dot */}
      {active && !danger && (
        <motion.div
          layoutId={`indicator-${label}`}
          className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-neon"
        />
      )}
    </motion.button>
  )
}

export function Controls({
  micOn,
  camOn,
  screenSharing,
  onToggleMic,
  onToggleCam,
  onToggleScreen,
  onToggleChat,
  onLeave,
}: ControlsProps) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="flex items-center justify-center gap-1 px-3 py-2 glass"
    >
      <ControlButton active={micOn} onClick={onToggleMic} label={micOn ? "Mute microphone" : "Unmute microphone"}>
        {micOn ? <Mic size={18} strokeWidth={1.5} /> : <MicOff size={18} strokeWidth={1.5} />}
      </ControlButton>

      <ControlButton active={camOn} onClick={onToggleCam} label={camOn ? "Turn off camera" : "Turn on camera"}>
        {camOn ? <Video size={18} strokeWidth={1.5} /> : <VideoOff size={18} strokeWidth={1.5} />}
      </ControlButton>

      <ControlButton active={screenSharing} onClick={onToggleScreen} label="Share screen">
        <Monitor size={18} strokeWidth={1.5} />
      </ControlButton>

      <div className="w-px h-6 bg-[rgba(255,255,255,0.08)] mx-1" />

      <ControlButton onClick={onToggleChat} label="Toggle chat">
        <MessageSquare size={18} strokeWidth={1.5} />
      </ControlButton>

      <div className="w-px h-6 bg-[rgba(255,255,255,0.08)] mx-1" />

      <ControlButton danger onClick={onLeave} label="Leave call">
        <PhoneOff size={18} strokeWidth={1.5} />
      </ControlButton>
    </motion.div>
  )
}
