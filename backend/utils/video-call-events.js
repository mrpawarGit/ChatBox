// Fixed server-side events with proper userId handling

const handleVideoCallEvents = (socket, io, onlineUsers) => {
  // Initiate video call
  socket.on("initiate_call", ({ callerId, receiverId, callType, callerInfo }) => {
    console.log(` SERVER: Call initiated from ${callerId} to ${receiverId}`)

    const receiverSocketId = onlineUsers.get(receiverId)

    if (receiverSocketId) {
      const callId = `${callerId}-${receiverId}-${Date.now()}`


      io.to(receiverSocketId).emit("incoming_call", {
        callerId,
        callerName: callerInfo.username,
        callerAvatar: callerInfo.profilePicture,
        callType,
        callId,
      })
    } else {
      console.log(`SERVER: Receiver ${receiverId} is offline`)
      socket.emit("call_failed", { reason: "User is offline" })
    }
  })

  // Accept call
  socket.on("accept_call", ({ callerId, callId, receiverInfo }) => {
    console.log(`SERVER: Call ${callId} accepted by receiver, notifying caller ${callerId}`)

    const callerSocketId = onlineUsers.get(callerId)

    if (callerSocketId) {
      io.to(callerSocketId).emit("call_accepted", {
        callId,
        receiverName: receiverInfo.username,
        receiverAvatar: receiverInfo.profilePicture,
      })
      console.log(` SERVER: call_accepted sent to caller ${callerId}`)
    } else {
      console.log(` SERVER: Caller ${callerId} not found`)
    }
  })

  // Reject call
  socket.on("reject_call", ({ callerId, callId }) => {
    const callerSocketId = onlineUsers.get(callerId)

    if (callerSocketId) {
      io.to(callerSocketId).emit("call_rejected", { callId })
    }
  })

  // End call
  socket.on("end_call", ({ callId, participantId }) => {
    console.log(` SERVER: Call ${callId} ended, notifying participant ${participantId}`)
    const participantSocketId = onlineUsers.get(participantId)

    if (participantSocketId) {
      io.to(participantSocketId).emit("call_ended", { callId })
    }
  })

  // WebRTC signaling events with proper userId handling
  socket.on("webrtc_offer", ({ offer, receiverId, callId }) => {
    console.log(`SERVER: Forwarding offer from ${socket.userId} to ${receiverId} for call ${callId}`)
    const receiverSocketId = onlineUsers.get(receiverId)

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("webrtc_offer", {
        offer,
        senderId: socket.userId, // Now this should be defined
        callId,
      })
      console.log(` SERVER: Offer forwarded to ${receiverId}`)
    } else {
      console.log(`SERVER: Receiver ${receiverId} not found for offer`)
    }
  })

  socket.on("webrtc_answer", ({ answer, receiverId, callId }) => {
    console.log(` SERVER: Forwarding answer from ${socket.userId} to ${receiverId} for call ${callId}`)
    const receiverSocketId = onlineUsers.get(receiverId)

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("webrtc_answer", {
        answer,
        senderId: socket.userId, // Now this should be defined
        callId,
      })
      console.log(` SERVER: Answer forwarded to ${receiverId}`)
    } else {
      console.log(` SERVER: Receiver ${receiverId} not found for answer`)
    }
  })

  socket.on("webrtc_ice_candidate", ({ candidate, receiverId, callId }) => {
    console.log(` SERVER: Forwarding ICE candidate from ${socket.userId} to ${receiverId}`)
    const receiverSocketId = onlineUsers.get(receiverId)

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("webrtc_ice_candidate", {
        candidate,
        senderId: socket.userId, // Now this should be defined
        callId,
      })
    } else {
      console.log(` SERVER: Receiver ${receiverId} not found for ICE candidate`)
    }
  })
}

module.exports = handleVideoCallEvents
