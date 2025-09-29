"use client"

import { useEffect, useCallback } from "react"
import useVideoCallStore from "../../store/videoCallStore"
import useUserStore from "../../store/useUserStore"
import VideoCallModal from "./VideoCallModal"

const VideoCallManager = ({ socket }) => {
  const { setIncomingCall, setCurrentCall, setCallType, setCallModalOpen, setCallStatus, endCall } = useVideoCallStore()

  const { user } = useUserStore()

  useEffect(() => {
    if (!socket) return

    // Handle incoming call
    const handleIncomingCall = ({ callerId, callerName, callerAvatar, callType, callId }) => {
      console.log("Received incoming call:", { callerId, callerName, callerAvatar, callType, callId })

      setIncomingCall({
        callerId,
        callerName,
        callerAvatar,
        callId,
      })
      setCallType(callType)
      setCallModalOpen(true)
      setCallStatus("ringing")
    }

    // Handle call failed
    const handleCallFailed = ({ reason }) => {
      console.error("Call failed:", reason)
      setCallStatus("failed")
      setTimeout(() => {
        endCall()
      }, 2000)
    }

    socket.on("incoming_call", handleIncomingCall)
    socket.on("call_failed", handleCallFailed)

    return () => {
      socket.off("incoming_call", handleIncomingCall)
      socket.off("call_failed", handleCallFailed)
    }
  }, [socket, setIncomingCall, setCallType, setCallModalOpen, setCallStatus, endCall])

  // Memoized function to initiate a call
  const initiateCall = useCallback(
    (receiverId, receiverName, receiverAvatar, callType = "video") => {
      const callId = `${user._id}-${receiverId}-${Date.now()}`

      console.log("Initiating call with:", {
        receiverId,
        receiverName,
        receiverAvatar,
        callType,
        callId,
      })

      // Validate the avatar URL
      const validatedAvatar =
        receiverAvatar && receiverAvatar !== "video" ? receiverAvatar : "/placeholder.svg?height=128&width=128"

      // Set current call FIRST before opening modal
      const callData = {
        callId,
        participantId: receiverId,
        participantName: receiverName,
        participantAvatar: validatedAvatar, // Use validated avatar
      }

      setCurrentCall(callData)
      setCallType(callType)
      setCallModalOpen(true)
      setCallStatus("calling")

      // Emit the call initiation
      socket.emit("initiate_call", {
        callerId: user._id,
        receiverId,
        callType,
        callerInfo: {
          username: user.username,
          profilePicture: user.profilePicture,
        },
      })

      console.log("Call initiated, currentCall set to:", callData)
    },
    [
      user._id,
      user.username,
      user.profilePicture,
      socket,
      setCurrentCall,
      setCallType,
      setCallModalOpen,
      setCallStatus,
    ],
  )

  // Expose the initiateCall function to the store
  useEffect(() => {
    useVideoCallStore.getState().initiateCall = initiateCall
  }, [initiateCall])

  return <VideoCallModal socket={socket} />
}

export default VideoCallManager
