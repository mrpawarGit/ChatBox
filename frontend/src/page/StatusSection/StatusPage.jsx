"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { FaPlus, FaEllipsisH, FaCamera } from "react-icons/fa"
import Layout from "../../components/Layout"
import StatusList from "./StatusList"
import StatusPreview from "./StatusPreview"
import formatTimestamp from "../../utils/formatTime"
import useThemeStore from "../../store/themeStore"
import useUserStore from "../../store/useUserStore"
import useStatusStore from "../../store/statusStore"

export default function StatusPage() {
  const [previewContact, setPreviewContact] = useState(null)
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0)
  const [showOptions, setShowOptions] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newStatus, setNewStatus] = useState("")
  const [filePreview, setFilePreview] = useState(null)

  const { theme } = useThemeStore()
  const { user } = useUserStore()

  // Status store
  const {
    statuses,
    loading,
    error,
    fetchStatuses,
    createStatus,
    viewStatus,
    deleteStatus,
    getUserStatuses,
    getOtherStatuses,
    initializeSocket,
    cleanupSocket,
    clearError,
  } = useStatusStore()

  // Get grouped statuses
  const userStatuses = getUserStatuses(user?._id)
  const otherStatuses = getOtherStatuses(user?._id)

  useEffect(() => {
    fetchStatuses()
    return () => {
      cleanupSocket()
    }
  }, [user?._id])

  // Clear error when component mounts
  useEffect(() => {
    return () => clearError()
  }, [])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        setFilePreview(URL.createObjectURL(file))
      }
    }
  }

  const handleCreateStatus = async () => {
    if (!newStatus.trim() && !selectedFile) return

    try {
      await createStatus({
        content: newStatus,
        file: selectedFile,
      })

      setNewStatus("")
      setSelectedFile(null)
      setFilePreview(null)
      setShowCreateModal(false)
    } catch (error) {
      // Error is handled by the store
      console.error("Failed to create status:", error)
    }
  }

  const handleViewStatus = async (statusId) => {
    try {
      await viewStatus(statusId)
    } catch (error) {
      console.error("Failed to view status:", error)
    }
  }

  const handleDeleteStatus = async (statusId) => {
    try {
      await deleteStatus(statusId)
      setShowOptions(false)
      handlePreviewClose()
    } catch (error) {
      console.error("Failed to delete status:", error)
    }
  }

  const handlePreviewClose = () => {
    setPreviewContact(null)
    setCurrentStatusIndex(0)
  }

  const handlePreviewNext = () => {
    if (currentStatusIndex < previewContact.statuses.length - 1) {
      setCurrentStatusIndex((prev) => prev + 1)
    } else {
      handlePreviewClose()
    }
  }

  const handlePreviewPrev = () => {
    setCurrentStatusIndex((prev) => Math.max(prev - 1, 0))
  }

  const handleStatusPreview = (contact, statusIndex = 0) => {
    setPreviewContact(contact)
    setCurrentStatusIndex(statusIndex)

    // Mark status as viewed
    if (contact.statuses[statusIndex]) {
      handleViewStatus(contact.statuses[statusIndex].id)
    }
  }

  return (
    <Layout
      isStatusPreviewOpen={!!previewContact}
      statusPreviewContent={
        previewContact && (
          <StatusPreview
            contact={previewContact}
            currentIndex={currentStatusIndex}
            onClose={handlePreviewClose}
            onNext={handlePreviewNext}
            onPrev={handlePreviewPrev}
            onDelete={handleDeleteStatus}
            theme={theme}
            currentUser={user}
          />
        )
      }
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`flex-1 h-screen border-r ${theme === "dark" ? "bg-[rgb(12,19,24)] border-gray-600 text-white" : "bg-gray-100 text-black"}`}
      >
        <div
          className={`${theme === "dark" ? "bg-[rgb(17,27,33)]" : "bg-white"} p-4 flex justify-between items-center shadow-md`}
        >
          <h2 className="text-2xl font-bold">Status</h2>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mx-4 mt-2">
            <span className="block sm:inline">{error}</span>
            <button onClick={clearError} className="float-right text-red-500 hover:text-red-700">
              ×
            </button>
          </div>
        )}

        <div className="overflow-y-auto h-[calc(100vh-64px)]">
          {/* My Status Section */}
          <div className={`flex p-3 space-x-4 ${theme === "dark" ? "bg-[rgb(17,27,33)]" : "bg-white"} shadow-md`}>
            <div
              className="relative cursor-pointer"
              onClick={() => (userStatuses ? handleStatusPreview(userStatuses) : setShowCreateModal(true))}
            >
              <img
                src={user?.profilePicture || "/placeholder.svg?height=64&width=64"}
                alt="Your Status"
                className="w-12 h-12 rounded-full object-cover"
              />
              {userStatuses ? (
                <>
                  <svg className="absolute top-0 left-0 w-12 h-12" viewBox="0 0 100 100">
                    {userStatuses.statuses.map((_, index) => {
                      const circumference = 2 * Math.PI * 48
                      const segmentLength = circumference / userStatuses.statuses.length
                      const offset = index * segmentLength

                      return (
                        <circle
                          key={index}
                          cx="50"
                          cy="50"
                          r="48"
                          fill="none"
                          stroke="#25D366"
                          strokeWidth="4"
                          strokeDasharray={`${segmentLength - 5} 5`}
                          strokeDashoffset={-offset}
                          transform="rotate(-90 50 50)"
                        />
                      )
                    })}
                  </svg>
                  {/* Add more status button */}
                  <button
                    className="absolute bottom-0 right-0 bg-green-500 text-white p-1 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowCreateModal(true)
                    }}
                  >
                    <FaPlus className="h-2 w-2" />
                  </button>
                </>
              ) : (
                <button
                  className="absolute bottom-0 right-0 bg-green-500 text-white p-1 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowCreateModal(true)
                  }}
                >
                  <FaPlus className="h-2 w-2" />
                </button>
              )}
            </div>
            <div className="flex flex-col items-start flex-1">
              <p className="font-semibold">My Status</p>
              <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                {userStatuses
                  ? `${userStatuses.statuses.length} status${userStatuses.statuses.length > 1 ? "es" : ""} • ${formatTimestamp(userStatuses.statuses[userStatuses.statuses.length - 1].timestamp)}`
                  : "Tap to add status update"}
              </p>
            </div>
            {userStatuses && (
              <button className="ml-auto" onClick={() => setShowOptions(!showOptions)}>
                <FaEllipsisH className={`h-5 w-5 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`} />
              </button>
            )}
          </div>

          {/* Options Menu */}
          {showOptions && userStatuses && (
            <div className={`${theme === "dark" ? "bg-[rgb(17,27,33)]" : "bg-white"} p-2 shadow-md`}>
              <button
                className="w-full text-left text-green-500 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 rounded flex items-center"
                onClick={() => {
                  setShowCreateModal(true)
                  setShowOptions(false)
                }}
              >
                <FaCamera className="inline-block mr-2" /> Add Status
              </button>
              <button
                className="w-full text-left text-blue-500 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 rounded"
                onClick={() => {
                  handleStatusPreview(userStatuses)
                  setShowOptions(false)
                }}
              >
                View Status
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
          )}

          {/* Recent Updates */}
          {!loading && otherStatuses.length > 0 && (
            <div className={`p-4 space-y-4 mt-4 ${theme === "dark" ? "bg-[rgb(17,27,33)]" : "bg-white"} shadow-md`}>
              <h3 className={`font-semibold ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                Recent updates
              </h3>
              {otherStatuses.map((contact, index) => (
                <React.Fragment key={contact.id}>
                  <StatusList contact={contact} onPreview={() => handleStatusPreview(contact)} theme={theme} />
                  {index < otherStatuses.length - 1 && (
                    <hr className={theme === "dark" ? "border-gray-700" : "border-gray-200"} />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && statuses.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className={`text-6xl mb-4 ${theme === "dark" ? "text-gray-600" : "text-gray-300"}`}>📱</div>
              <h3 className={`text-lg font-semibold mb-2 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                No status updates yet
              </h3>
              <p className={`text-sm ${theme === "dark" ? "text-gray-500" : "text-gray-500"}`}>
                Be the first to share a status update!
              </p>
            </div>
          )}
        </div>

        {/* Create Status Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`p-6 rounded-lg max-w-md w-full mx-4 ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}>
              <h3 className={`text-lg font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-black"}`}>
                Create Status
              </h3>

              {filePreview && (
                <div className="mb-4">
                  {selectedFile?.type.startsWith("image/") ? (
                    <img
                      src={filePreview || "/placeholder.svg"}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded"
                    />
                  ) : (
                    <video src={filePreview} className="w-full h-32 object-cover rounded" controls />
                  )}
                </div>
              )}

              <textarea
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                placeholder="What's on your mind?"
                className={`w-full p-3 border rounded-lg mb-4 ${
                  theme === "dark" ? "bg-gray-700 text-white border-gray-600" : "bg-white text-black border-gray-300"
                }`}
                rows={3}
              />

              <input type="file" accept="image/*,video/*" onChange={handleFileChange} className="mb-4" />

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewStatus("")
                    setSelectedFile(null)
                    setFilePreview(null)
                  }}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateStatus}
                  disabled={loading || (!newStatus.trim() && !selectedFile)}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </Layout>
  )
}
