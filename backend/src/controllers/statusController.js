const Status = require("../../models/Status")
const { uploadFileToCloudinary } = require("../../config/cloudinaryConfig")
const response = require("../../utils/responseHandler")

exports.createStatus = async (req, res) => {
  const { content, contentType } = req.body
  const userId = req.user.id
  const file = req.file


  try {
    let mediaUrl = null
    let finalContentType = contentType || "text"

    if (file) {
      const uploadedFile = await uploadFileToCloudinary(file)
      if (!uploadedFile?.secure_url) {
        return response(res, 400, "Failed to upload media")
      }
      mediaUrl = uploadedFile.secure_url

      if (file.mimetype.startsWith("image")) {
        finalContentType = "image"
      } else if (file.mimetype.startsWith("video")) {
        finalContentType = "video"
      }
    }

    // Set expiration to 24 hours from now
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    const status = new Status({
      user: userId,
      content: mediaUrl || content,
      contentType: finalContentType,
      expiresAt,
    })

    await status.save()

    const populatedStatus = await Status.findById(status._id)
      .populate("user", "username profilePicture")
      .populate("viewers", "username profilePicture")


    // ✅ EMIT SOCKET EVENT
    if (req.io && req.socketUserMap) {
      // Broadcast to all connected users except the creator
      for (const [connectedUserId, socketId] of req.socketUserMap) {
        if (connectedUserId !== userId) {
          req.io.to(socketId).emit("new_status", populatedStatus)
        }
      }
      
    } 

    return response(res, 201, "Status created successfully", populatedStatus)
  } catch (error) {
    console.error("Error creating status:", error)
    return response(res, 500, error.message)
  }
}

exports.getStatuses = async (req, res) => {
  try {
    const statuses = await Status.find({
      expiresAt: { $gt: new Date() },
    })
      .populate("user", "username profilePicture")
      .populate("viewers", "username profilePicture")
      .sort({ createdAt: -1 })

    return response(res, 200, "Statuses retrieved successfully", statuses)
  } catch (error) {
    console.error("Error getting statuses:", error)
    return response(res, 500, error.message)
  }
}

exports.viewStatus = async (req, res) => {
  const { statusId } = req.params
  const userId = req.user.id

  try {
    const status = await Status.findById(statusId)
    if (!status) {
      return response(res, 404, "Status not found")
    }

    // Add viewer if not already viewed
    if (!status.viewers.includes(userId)) {
      status.viewers.push(userId)
      await status.save()

      console.log('Added new viewer, total viewers now:', status.viewers.length)

      // Get updated status with populated data
      const updatedStatus = await Status.findById(statusId)
        .populate("user", "username profilePicture")
        .populate("viewers", "username profilePicture")

      // ✅ EMIT SOCKET EVENT
      if (req.io && req.socketUserMap) {
        const statusOwnerSocketId = req.socketUserMap.get(status.user._id.toString())
        
        if (statusOwnerSocketId) {
          const viewData = {
            statusId,
            viewerId: userId,
            totalViewers: updatedStatus.viewers.length,
            viewers: updatedStatus.viewers,
          }
          
          console.log('Emitting status_viewed to owner:', viewData)
          req.io.to(statusOwnerSocketId).emit("status_viewed", viewData)
        } else {
          console.log('Status owner not connected')
        }
      } 
    } else {
      console.log('User already viewed this status')
    }

    return response(res, 200, "Status viewed")
  } catch (error) {
    console.error("Error viewing status:", error)
    return response(res, 500, error.message)
  }
}

exports.deleteStatus = async (req, res) => {
  const { statusId } = req.params
  const userId = req.user.id


  try {
    const status = await Status.findById(statusId)
    if (!status) {
      return response(res, 404, "Status not found")
    }

    if (status.user.toString() !== userId) {
      return response(res, 403, "Not authorized to delete this status")
    }

    await status.deleteOne()
    console.log('Status deleted from database')

    // ✅ EMIT SOCKET EVENT
    if (req.io && req.socketUserMap) {
      // Broadcast to all connected users except the deleter
      for (const [connectedUserId, socketId] of req.socketUserMap) {
        if (connectedUserId !== userId) {
          req.io.to(socketId).emit("status_deleted", statusId)
        }
      }
      
      console.log(`Emitted status_deleted to ${emittedCount} users`)
    } 
    return response(res, 200, "Status deleted successfully")
  } catch (error) {
    console.error("Error deleting status:", error)
    return response(res, 500, error.message)
  }
}
