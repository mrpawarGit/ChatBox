"use client"

import { useState, useEffect } from "react"
import { FaTimes, FaChevronLeft, FaChevronRight, FaTrash, FaChevronDown, FaEye } from "react-icons/fa"
import { motion, AnimatePresence } from "framer-motion"
import formatTimestamp from "../../utils/formatTime"

const StatusPreview = ({ contact, currentIndex, onClose, onNext, onPrev, onDelete, theme, currentUser }) => {
  const [progress, setProgress] = useState(0)
  const [showViewers, setShowViewers] = useState(false)
  const [loadingViewers, setLoadingViewers] = useState(false)


  const currentStatus = contact?.statuses[currentIndex]
  const isOwnStatus = contact?.id === currentUser?._id

    console.log(currentStatus)

useEffect(() => {
  setProgress(0) // Reset the progress bar when a new status is shown

  let current = 0 // Initialize a local counter for tracking progress manually

  const interval = setInterval(() => {
    current += 2 // Increase progress by 2% every 100ms → 50 steps = 5 seconds
    setProgress(current) // Update the progress bar in the UI

    if (current >= 100) {
      clearInterval(interval) // Stop the timer when progress reaches 100%
      onNext() // Move to the next status automatically
    }
  }, 100)

  return () => clearInterval(interval) // Cleanup the interval when status changes or component unmounts
}, [currentIndex])




  const handleViewersToggle = () => {
    setShowViewers(!showViewers)
  }

const handleDeleteStatus = () => {
  if (onDelete && currentStatus?.id) {
    onDelete(currentStatus.id) // Call the delete function passed via props

    if (contact.statuses.length === 1) {
      onClose() // If it's the last status, close the preview
    } else if (currentIndex === contact.statuses.length - 1) {
      onPrev() // If it's the last in the list, go to the previous one
    }
  }
}

  if (!currentStatus) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 w-full h-full bg-black bg-opacity-90 z-50 flex items-center justify-center"
      style={{ backdropFilter: "blur(5px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full h-full max-w-4xl mx-auto flex justify-center items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`w-full h-full ${theme === "dark" ? "bg-[#202c33]" : "bg-gray-800"} relative`}>
          {/* Progress bars */}
          <div className="absolute top-0 left-0 right-0 flex justify-between p-4 z-10 gap-1">
            {contact?.statuses.map((_, index) => (
              <div key={index} className="h-1 bg-gray-400 bg-opacity-50 flex-1 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-100 ease-linear rounded-full"
                  style={{
                    width: index < currentIndex ? "100%" : index === currentIndex ? `${progress}%` : "0%",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header with user info */}
          <div className="absolute top-8 left-4 right-16 z-10 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src={contact.avatar || "/placeholder.svg"}
                alt={contact.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-white"
              />
              <div>
                <p className="text-white font-semibold">{contact.name}</p>
                <p className="text-gray-300 text-sm">{formatTimestamp(currentStatus.timestamp)}</p>
              </div>
            </div>

            {/* Status actions for own status */}
            {isOwnStatus && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDeleteStatus}
                  className="text-white bg-red-500 bg-opacity-70 rounded-full p-2 hover:bg-opacity-90 transition-all"
                >
                  <FaTrash className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Status content */}
          <div className="w-full h-full flex items-center justify-center">
            {currentStatus.contentType === "text" ? (
              <div className="text-white text-center p-8">
                <p className="text-2xl font-medium">{currentStatus.media}</p>
              </div>
            ) : currentStatus.contentType === "image" ? (
              <img
                src={currentStatus.media || "/placeholder.svg"}
                alt={`${contact.name}'s status`}
                className="max-w-full max-h-full object-contain"
              />
            ) : currentStatus.contentType === "video" ? (
              <video
                src={currentStatus.media}
                className="max-w-full max-h-full object-contain"
                controls
                autoPlay
                muted
              />
            ) : null}
          </div>

          {/* Close button */}
          <button
            className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-3 hover:bg-opacity-70 transition-all z-10"
            onClick={onClose}
          >
            <FaTimes className="h-5 w-5" />
          </button>

          {/* Navigation buttons */}
          {currentIndex > 0 && (
            <button
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 rounded-full p-3 hover:bg-opacity-70 transition-all"
              onClick={onPrev}
            >
              <FaChevronLeft className="h-5 w-5" />
            </button>
          )}

          {currentIndex < contact?.statuses?.length - 1 && (
            <button
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 rounded-full p-3 hover:bg-opacity-70 transition-all"
              onClick={onNext}
            >
              <FaChevronRight className="h-5 w-5" />
            </button>
          )}

          {/* Viewers section (only for own status) */}
          {isOwnStatus &&  (
            <div className="absolute bottom-4 left-4 right-4">
              <button
                onClick={handleViewersToggle}
                className="flex items-center justify-between w-full text-white bg-black bg-opacity-50 rounded-lg px-4 py-2 hover:bg-opacity-70 transition-all"
              >
                <div className="flex items-center space-x-2">
                  <FaEye className="h-4 w-4" />
                  <span>{currentStatus.viewers.length} views</span>
                </div>
                <FaChevronDown className={`h-4 w-4 transition-transform ${showViewers ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {showViewers && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 bg-black bg-opacity-70 rounded-lg p-4 max-h-40 overflow-y-auto"
                  >
                    {loadingViewers ? (
                      <p className="text-white text-center">Loading viewers...</p>
                    ) : currentStatus.viewers.length > 0 ? (
                      <div className="space-y-2">
                        {currentStatus.viewers.map((viewer) => (
                          <div key={viewer._id} className="flex items-center space-x-3">
                            <img
                              src={viewer.profilePicture || "/placeholder.svg"}
                              alt={viewer.username}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <span className="text-white">{viewer.username}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-white text-center">No viewers yet</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default StatusPreview
