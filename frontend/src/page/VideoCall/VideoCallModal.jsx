"use client"

import { useEffect, useRef, useMemo } from "react"
import { FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash, FaPhoneSlash, FaTimes } from "react-icons/fa"
import useVideoCallStore from "../../store/videoCallStore"
import useUserStore from "../../store/useUserStore"
import useThemeStore from "../../store/themeStore"

const VideoCallModal = ({ socket }) => {
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)

  const {
    currentCall,
    incomingCall,
    isCallActive,
    callType,
    localStream,
    remoteStream,
    isVideoEnabled,
    isAudioEnabled,
    peerConnection,
    callStatus,
    isCallModalOpen,
    toggleVideo,
    toggleAudio,
    endCall,
    setLocalStream,
    setRemoteStream,
    setPeerConnection,
    setCallStatus,
    setCallActive,
    clearIncomingCall,
    setCurrentCall,
    addIceCandidate,
    processQueuedIceCandidates,
  } = useVideoCallStore()

  const { user } = useUserStore()
  const { theme } = useThemeStore()

  // The rtcConfiguration object you posted is used to configure a WebRTC peer-to-peer connection. 
  // Specifically, it helps define how two browsers can discover and connect to each other, 
  // even when they're behind firewalls or NATs.
  const rtcConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
    ],
  }

  // Memoize display info to prevent unnecessary re-renders
  const displayInfo = useMemo(() => {
    if (incomingCall && !isCallActive) {
      return {
        name: incomingCall.callerName,
        avatar: incomingCall.callerAvatar,
      }
    } else if (currentCall) {
      return {
        name: currentCall.participantName,
        avatar: currentCall.participantAvatar,
      }
    }
    return null
  }, [incomingCall, currentCall, isCallActive])

  // Connection detection
  useEffect(() => {
    if (peerConnection && remoteStream) {
      console.log("Both peer connection and remote stream available - marking as connected")
      setCallStatus("connected")
      setCallActive(true)
    }
  }, [peerConnection, remoteStream, setCallStatus, setCallActive])

  // Set up local video when localStream changes
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  // Set up remote video when remoteStream changes
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  // Initialize media stream
  const initializeMedia = async (video = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: 640, height: 480 } : false,
        audio: true,
      })

      console.log(
        " Media obtained:",
        stream.getTracks().map((t) => `${t.kind}:${t.id.slice(0, 8)}`),
      )
      setLocalStream(stream)
      return stream
    } catch (error) {
      console.error(" Media error:", error)
      throw error
    }
  }

  // Create peer connection
  const createPeerConnection = (stream, role) => {
    const pc = new RTCPeerConnection(rtcConfiguration)

    // Add local tracks immediately
    if (stream) {
      stream.getTracks().forEach((track) => {
        console.log(`${role}: Adding ${track.kind} track:`, track.id.slice(0, 8))
        pc.addTrack(track, stream)
      })
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        const participantId = currentCall?.participantId || incomingCall?.callerId
        const callId = currentCall?.callId || incomingCall?.callId

        if (participantId && callId) {
          console.log(`${role}: Sending ICE candidate`)
          socket.emit("webrtc_ice_candidate", {
            candidate: event.candidate,
            receiverId: participantId,
            callId: callId,
          })
        }
      }
    }

    // Handle remote stream - CRITICAL FIX
    pc.ontrack = (event) => {

      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0])
      } else {
        // Fallback: create stream from track
        const stream = new MediaStream([event.track])
        setRemoteStream(stream)
      }
    }

    // Connection state monitoring
    pc.onconnectionstatechange = () => {
      console.log(` ${role}: Connection state:`, pc.connectionState)
      if (pc.connectionState === "failed") {
        setCallStatus("failed")
        setTimeout(handleEndCall, 2000)
      }
    }

    pc.oniceconnectionstatechange = () => {
      console.log(` ${role}: ICE state:`, pc.iceConnectionState)
    }

    pc.onsignalingstatechange = () => {
      console.log(`${role}: Signaling state:`, pc.signalingState)
    }

    setPeerConnection(pc)
    return pc
  }

  // CALLER: Initialize call after acceptance
  const initializeCallerCall = async () => {
    try {
      setCallStatus("connecting")

      // 1. Get media
      const stream = await initializeMedia(callType === "video")

      // 2. Create peer connection with tracks
      const pc = createPeerConnection(stream, "CALLER")

      // 3. Create and send offer
      console.log("CALLER: Creating offer...")
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === "video",
      })

      await pc.setLocalDescription(offer)

      socket.emit("webrtc_offer", {
        offer,
        receiverId: currentCall.participantId,
        callId: currentCall.callId,
      })

    } catch (error) {
      console.error("CALLER error:", error)
      setCallStatus("failed")
      setTimeout(handleEndCall, 2000)
    }
  }

  // RECEIVER: Answer call
  const handleAnswerCall = async () => {
    try {
      setCallStatus("connecting")

      // 1. Get media
      const stream = await initializeMedia(callType === "video")

      // 2. Create peer connection with tracks
      createPeerConnection(stream, "RECEIVER")

      // 3. Send accept signal
      socket.emit("accept_call", {
        callerId: incomingCall.callerId,
        callId: incomingCall.callId,
        receiverInfo: {
          username: user.username,
          profilePicture: user.profilePicture,
        },
      })

      // 4. Move to current call state
      setCurrentCall({
        callId: incomingCall.callId,
        participantId: incomingCall.callerId,
        participantName: incomingCall.callerName,
        participantAvatar: incomingCall.callerAvatar,
      })

      clearIncomingCall()
      console.log(" RECEIVER: Ready for offer")
    } catch (error) {
      console.error(" RECEIVER error:", error)
      handleEndCall()
    }
  }

  // Handle reject call
  const handleRejectCall = () => {
    if (incomingCall) {
      socket.emit("reject_call", {
        callerId: incomingCall.callerId,
        callId: incomingCall.callId,
      })
    }
    endCall()
  }

  // Handle end call
  const handleEndCall = () => {
    const participantId = currentCall?.participantId || incomingCall?.callerId
    const callId = currentCall?.callId || incomingCall?.callId

    if (participantId && callId) {
      socket.emit("end_call", {
        callId: callId,
        participantId: participantId,
      })
    }
    endCall()
  }

  // Socket event listeners - FIXED
  useEffect(() => {
    if (!socket) return


    // Call accepted - start caller flow
    const handleCallAccepted = ({ receiverName }) => {
      console.log("✅ CALLER: Call accepted by", receiverName)
      if (currentCall) {
        // Small delay to ensure receiver is ready
        setTimeout(() => {
          initializeCallerCall()
        }, 500)
      }
    }

    // Call rejected
    const handleCallRejected = () => {
      console.log(" Call rejected")
      setCallStatus("rejected")
      setTimeout(endCall, 2000)
    }

    // Call ended
    const handleCallEnded = () => {
      console.log(" Call ended")
      endCall()
    }

    // Receive offer (RECEIVER)
    const handleWebRTCOffer = async ({ offer, senderId, callId }) => {

      if (!peerConnection) {
        console.error("RECEIVER: No peer connection!")
        return
      }

      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
        console.log(" RECEIVER: Remote description set")

        // Process queued ICE candidates
        await processQueuedIceCandidates()

        // Create answer
        const answer = await peerConnection.createAnswer()
        await peerConnection.setLocalDescription(answer)
        console.log("RECEIVER: Sending answer to", senderId)

        socket.emit("webrtc_answer", {
          answer,
          receiverId: senderId, // This should be the caller's ID
          callId,
        })

        console.log("RECEIVER: Answer sent, waiting for ICE connection...")
      } catch (error) {
        console.error(" RECEIVER offer error:", error)
      }
    }

    // Receive answer (CALLER) - CRITICAL FIX
    const handleWebRTCAnswer = async ({ answer, senderId, callId }) => {

      if (!peerConnection) {
        console.error(" CALLER: No peer connection!")
        return
      }

      if (peerConnection.signalingState === "closed") {
        console.error("CALLER: Peer connection is closed!")
        return
      }

      try {
  
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer))


        // Process queued ICE candidates
        console.log(" CALLER: Processing queued ICE candidates...")
        await processQueuedIceCandidates()

        // Check receivers
        const receivers = peerConnection.getReceivers()
        receivers.forEach((receiver, index) => {
          console.log(`CALLER: Receiver ${index + 1}:`, {
            hasTrack: !!receiver.track,
            trackKind: receiver.track?.kind,
            trackId: receiver.track?.id?.slice(0, 8),
            trackReadyState: receiver.track?.readyState,
          })
        })

        console.log("CALLER: Answer processed, waiting for ontrack...")
      } catch (error) {
        console.error("CALLER answer error:", error)
      }
    }

    // Receive ICE candidate
    const handleWebRTCIceCandidate = async ({ candidate, senderId }) => {
      console.log("🧊 Received ICE candidate from", senderId)

      if (peerConnection && peerConnection.signalingState !== "closed") {
        if (peerConnection.remoteDescription) {
          try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
            console.log("ICE candidate added")
          } catch (error) {
            console.error("iCE error:", error)
          }
        } else {
          addIceCandidate(candidate)
        }
      }
    }

    // Register all event listeners
    socket.on("call_accepted", handleCallAccepted)
    socket.on("call_rejected", handleCallRejected)
    socket.on("call_ended", handleCallEnded)
    socket.on("webrtc_offer", handleWebRTCOffer)
    socket.on("webrtc_answer", handleWebRTCAnswer)
    socket.on("webrtc_ice_candidate", handleWebRTCIceCandidate)

    console.log("Socket listeners registered")

    return () => {
      console.log("🔌 Cleaning up socket listeners...")
      socket.off("call_accepted", handleCallAccepted)
      socket.off("call_rejected", handleCallRejected)
      socket.off("call_ended", handleCallEnded)
      socket.off("webrtc_offer", handleWebRTCOffer)
      socket.off("webrtc_answer", handleWebRTCAnswer)
      socket.off("webrtc_ice_candidate", handleWebRTCIceCandidate)
    }
  }, [socket, peerConnection, currentCall, incomingCall, user.username, user.profilePicture])

  // Don't render if modal should not be open
  if (!isCallModalOpen && !incomingCall) {
    return null
  }

  console.log("🎬 Render:", {
    status: callStatus,
    active: isCallActive,
    local: !!localStream,
    remote: !!remoteStream,
  })

  const shouldShowActiveCall = isCallActive || callStatus === "calling" || callStatus === "connecting"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div
        className={`relative w-full h-full max-w-4xl max-h-3xl rounded-lg overflow-hidden ${
          theme === "dark" ? "bg-gray-900" : "bg-white"
        }`}
      >
        {/* Incoming Call UI */}
        {incomingCall && !isCallActive && (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="text-center mb-8">
              <div className="w-32 h-32 rounded-full bg-gray-300 mx-auto mb-4 overflow-hidden">
                <img
                  src={displayInfo?.avatar || "/placeholder.svg?height=128&width=128"}
                  alt={displayInfo?.name || "Unknown"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "/placeholder.svg?height=128&width=128"
                  }}
                />
              </div>
              <h2 className={`text-2xl font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                {displayInfo?.name || "Unknown"}
              </h2>
              <p className={`text-lg ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                Incoming {callType} call...
              </p>
            </div>

            <div className="flex space-x-6">
              <button
                onClick={handleRejectCall}
                className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <FaPhoneSlash className="w-6 h-6" />
              </button>
              <button
                onClick={handleAnswerCall}
                className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <FaVideo className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {/* Active Call UI */}
        {shouldShowActiveCall && (
          <div className="relative w-full h-full">
            {/* Remote Video */}
            {callType === "video" && (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover bg-gray-800 ${remoteStream ? "block" : "hidden"}`}
              />
            )}

            {/* Avatar/Status Display */}
            {(!remoteStream || callType !== "video") && (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 rounded-full bg-gray-600 mx-auto mb-4 overflow-hidden">
                    <img
                      src={displayInfo?.avatar || "/placeholder.svg?height=128&width=128"}
                      alt={displayInfo?.name || "Unknown"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "/placeholder.svg?height=128&width=128"
                      }}
                    />
                  </div>
                  <p className="text-white text-xl">
                    {callStatus === "calling"
                      ? `Calling ${displayInfo?.name || "User"}...`
                      : callStatus === "connecting"
                        ? "Connecting..."
                        : callStatus === "connected"
                          ? displayInfo?.name || "Connected"
                          : callStatus === "failed"
                            ? "Connection failed"
                            : displayInfo?.name || "Unknown"}
                  </p>
                </div>
              </div>
            )}

            {/* Local Video (Picture-in-Picture) */}
            {callType === "video" && localStream && (
              <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white">
                <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              </div>
            )}

            {/* Call Status */}
            <div className="absolute top-4 left-4">
              <div className={`px-4 py-2 rounded-full ${theme === "dark" ? "bg-gray-800" : "bg-white"} bg-opacity-75`}>
                <p className={`text-sm ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                  {callStatus === "connected" ? "Connected" : callStatus}
                </p>
              </div>
            </div>

            {/* Call Controls */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
              <div className="flex space-x-4">
                {callType === "video" && (
                  <button
                    onClick={toggleVideo}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      isVideoEnabled
                        ? "bg-gray-600 hover:bg-gray-700 text-white"
                        : "bg-red-500 hover:bg-red-600 text-white"
                    }`}
                  >
                    {isVideoEnabled ? <FaVideo className="w-5 h-5" /> : <FaVideoSlash className="w-5 h-5" />}
                  </button>
                )}

                <button
                  onClick={toggleAudio}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    isAudioEnabled
                      ? "bg-gray-600 hover:bg-gray-700 text-white"
                      : "bg-red-500 hover:bg-red-600 text-white"
                  }`}
                >
                  {isAudioEnabled ? <FaMicrophone className="w-5 h-5" /> : <FaMicrophoneSlash className="w-5 h-5" />}
                </button>

                <button
                  onClick={handleEndCall}
                  className="w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  <FaPhoneSlash className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Close button for calling state */}
        {callStatus === "calling" && (
          <button
            onClick={handleEndCall}
            className="absolute top-4 right-4 w-8 h-8 bg-gray-600 hover:bg-gray-700 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

export default VideoCallModal
