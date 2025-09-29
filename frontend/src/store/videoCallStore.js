import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

const useVideoCallStore = create(
  subscribeWithSelector((set, get) => ({
    // Call state
    currentCall: null,
    incomingCall: null,
    isCallActive: false,
    callType: null, // 'video' or 'audio'

    // Media state
    localStream: null,
    remoteStream: null,
    isVideoEnabled: true,
    isAudioEnabled: true,

    // WebRTC
    peerConnection: null,
    iceCandidatesQueue: [], // Queue for ICE candidates
    // ICE (Interactive Connectivity Establishment) is a protocol used in WebRTC to find the best path (like IP and port) between peers to establish a connection.

    // UI state
    isCallModalOpen: false,
    callStatus: "idle", // 'idle', 'calling', 'ringing', 'connecting', 'connected', 'ended'

    // Actions
    setCurrentCall: (call) => {
      console.log("📞 Setting current call:", call);
      set({ currentCall: call });
    },

    setIncomingCall: (call) => {
      console.log("📞 Setting incoming call:", call);
      set({ incomingCall: call });
    },

    setCallActive: (active) => {
      console.log("🔄 Call active:", active);
      set({ isCallActive: active });
    },

    setCallType: (type) => set({ callType: type }),

    setLocalStream: (stream) => {
      console.log("🎥 Local stream:", !!stream);
      set({ localStream: stream });
    },

    setRemoteStream: (stream) => {
      console.log("🎥 Remote stream:", !!stream);
      set({ remoteStream: stream });
    },

    setPeerConnection: (pc) => {
      console.log("🔗 Peer connection:", !!pc);
      set({ peerConnection: pc });
    },

    setCallModalOpen: (open) => set({ isCallModalOpen: open }),

    setCallStatus: (status) => {
      console.log("📊 Status:", status);
      set({ callStatus: status });
    },

    // Add ICE candidate to queue
    addIceCandidate: (candidate) => {
      const { iceCandidatesQueue } = get();
      set({ iceCandidatesQueue: [...iceCandidatesQueue, candidate] });
    },

    // Process queued ICE candidates
    processQueuedIceCandidates: async () => {
      const { peerConnection, iceCandidatesQueue } = get();
      if (
        peerConnection &&
        peerConnection.remoteDescription &&
        iceCandidatesQueue.length > 0
      ) {
        console.log(
          "🧊 Processing",
          iceCandidatesQueue.length,
          "ICE candidates"
        );
        for (const candidate of iceCandidatesQueue) {
          try {
            await peerConnection.addIceCandidate(
              new RTCIceCandidate(candidate)
            );
          } catch (error) {
            console.error("❌ ICE candidate error:", error);
          }
        }
        set({ iceCandidatesQueue: [] });
      }
    },

    toggleVideo: () => {
      const { localStream, isVideoEnabled } = get();
      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = !isVideoEnabled;
          set({ isVideoEnabled: !isVideoEnabled });
        }
      }
    },

    toggleAudio: () => {
      const { localStream, isAudioEnabled } = get();
      if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = !isAudioEnabled;
          set({ isAudioEnabled: !isAudioEnabled });
        }
      }
    },

    endCall: () => {
      const { localStream, peerConnection } = get();

      console.log("📞 Ending call");

      // Stop all tracks
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }

      // Close peer connection
      if (peerConnection) {
        peerConnection.close();
      }

      // Reset state
      set({
        currentCall: null,
        incomingCall: null,
        isCallActive: false,
        callType: null,
        localStream: null,
        remoteStream: null,
        peerConnection: null,
        isCallModalOpen: false,
        callStatus: "idle",
        isVideoEnabled: true,
        isAudioEnabled: true,
        iceCandidatesQueue: [],
      });
    },

    clearIncomingCall: () => {
      console.log("🗑️ Clearing incoming call");
      set({ incomingCall: null });
    },
  }))
);

export default useVideoCallStore;
