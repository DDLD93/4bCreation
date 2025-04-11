const WebnarModel = require("../model/webnar.model"); // Corrected filename
const ClusterModel = require("../model/cluster.model"); // Needed for potential cluster updates
const UserModel = require("../model/user.model"); // Needed for user validation
const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config");

class WebnarController {
  constructor() {
  }

  async createWebnar(body) {
    try {
      const newWebnar = new WebnarModel(body);
      await newWebnar.save();
      
      // Optional: If creating a webinar should update the associated cluster
      if (newWebnar.cluster) {
         await ClusterModel.findByIdAndUpdate(newWebnar.cluster, { $addToSet: { webinars: newWebnar._id } });
      }
      
      return {
        ok: true,
        data: newWebnar,
        message: "Webinar created successfully",
      };
    } catch (error) {
      console.log("Error creating webinar:", error.message);
      return { ok: false, message: error.message };
    }
  }

  async getWebnars(filter = {}, options = {}) {
    try {
      const page = parseInt(options.page) || 1;
      const limit = parseInt(options.limit) || 50;
      const skip = (page - 1) * limit;
      const sort = options.sort || { startTime: 1 }; // Default sort by start time ascending

      let query = WebnarModel.find(filter);

      if (options.select) {
          query = query.select(options.select);
      }
      
      query = query.sort(sort).skip(skip).limit(limit);

      if (options.populate) {
          query = query.populate(options.populate); // e.g., populate 'cluster', 'presenter'
      }

      // Specific filter for upcoming or past webinars based on current time
      const now = new Date();
      if (options.timeFilter === 'upcoming') {
        query = query.where('startTime').gte(now);
        // Ensure ascending sort for upcoming
        if(!options.sort) query = query.sort({ startTime: 1 }); 
      } else if (options.timeFilter === 'past') {
        query = query.where('startTime').lt(now);
         // Ensure descending sort for past
        if(!options.sort) query = query.sort({ startTime: -1 });
      }

      const total = await WebnarModel.countDocuments(filter);
      // Re-apply time filter to countDocuments if necessary for accurate total
       let countFilter = { ...filter };
       if (options.timeFilter === 'upcoming') {
           countFilter.startTime = { $gte: now };
       } else if (options.timeFilter === 'past') {
           countFilter.startTime = { $lt: now };
       }
      const filteredTotal = await WebnarModel.countDocuments(countFilter);

      const webnars = await query.exec();

      // Use filteredTotal for pagination if timeFilter is applied
      const paginationTotal = options.timeFilter ? filteredTotal : total; 
      const totalPages = Math.ceil(paginationTotal / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      return {
        ok: true,
        data: webnars,
        pagination: {
          total: paginationTotal,
          totalPages,
          currentPage: page,
          limit,
          hasNext,
          hasPrev,
          // Optionally include the grand total if different
          ...(options.timeFilter && { grandTotal: total })
        },
        message: `Found ${webnars.length} webinars (page ${page} of ${totalPages})`
      };
    } catch (error) {
      console.log("Error fetching webinars:", error.message);
      return { ok: false, message: error.message };
    }
  }

  async getWebnarById(id, options = {}) {
    try {
      let query = WebnarModel.findById(id);
      if (options.populate) {
          query = query.populate(options.populate);
      }
      const webnar = await query.exec();
      if (!webnar) {
        return { ok: false, message: "Webinar not found" };
      }
      return { ok: true, data: webnar, message: "Webinar retrieved successfully" };
    } catch (error) {
      console.log("Error retrieving webinar:", error.message);
      return { ok: false, message: error.message };
    }
  }

  async updateWebnar(id, newData) {
    try {
      // Handle potential cluster change: remove from old, add to new
      const oldWebnar = await WebnarModel.findById(id).select('cluster');
      const oldClusterId = oldWebnar ? oldWebnar.cluster : null;
      const newClusterId = newData.cluster;

      const updatedWebnar = await WebnarModel.findByIdAndUpdate(id, newData, { new: true, runValidators: true });

      if (updatedWebnar) {
          // If cluster changed, update both old and new clusters
          if (oldClusterId && newClusterId && oldClusterId.toString() !== newClusterId.toString()) {
              await ClusterModel.findByIdAndUpdate(oldClusterId, { $pull: { webinars: id } });
              await ClusterModel.findByIdAndUpdate(newClusterId, { $addToSet: { webinars: id } });
          } else if (oldClusterId && !newClusterId) { // Removed from cluster
               await ClusterModel.findByIdAndUpdate(oldClusterId, { $pull: { webinars: id } });
          } else if (!oldClusterId && newClusterId) { // Added to cluster
               await ClusterModel.findByIdAndUpdate(newClusterId, { $addToSet: { webinars: id } });
          }
      } 
      
      return { ok: true, data: updatedWebnar, message: updatedWebnar ? "Webinar updated successfully" : "Webinar not found" };
    } catch (error) {
      console.log("Error updating webinar:", error.message);
      return { ok: false, message: error.message };
    }
  }

  async deleteWebnar(id) {
    try {
      // Also remove webinar reference from its cluster
      const deletedWebnar = await WebnarModel.findByIdAndDelete(id);
      if (deletedWebnar && deletedWebnar.cluster) {
          await ClusterModel.findByIdAndUpdate(deletedWebnar.cluster, { $pull: { webinars: deletedWebnar._id } });
      }
      // TODO: Consider deleting related Quizzes, Interactions, etc. or handle via hooks.
      return { ok: true, data: deletedWebnar, message: deletedWebnar ? "Webinar deleted successfully" : "Webinar not found" };
    } catch (error) {
      console.log("Error deleting webinar:", error.message);
      return { ok: false, message: error.message };
    }
  }

  // Add specific methods: register user, unregister user, get attendees, etc.
    async registerUserForWebnar(webinarId, userId) {
        try {
            const updatedWebnar = await WebnarModel.findByIdAndUpdate(
                webinarId,
                { $addToSet: { attendees: userId } }, // Use $addToSet to avoid duplicates
                { new: true }
            );
            if (!updatedWebnar) return { ok: false, message: "Webinar not found" };
            // TODO: Add interaction log if needed
            return { ok: true, data: updatedWebnar, message: "User registered successfully" };
        } catch (error) {
            console.log("Error registering user for webinar:", error.message);
            return { ok: false, message: error.message };
        }
    }

    async unregisterUserFromWebnar(webinarId, userId) {
        try {
            const updatedWebnar = await WebnarModel.findByIdAndUpdate(
                webinarId,
                { $pull: { attendees: userId } },
                { new: true }
            );
             if (!updatedWebnar) return { ok: false, message: "Webinar not found" };
            // TODO: Add interaction log if needed
            return { ok: true, data: updatedWebnar, message: "User unregistered successfully" };
        } catch (error) {
            console.log("Error unregistering user from webinar:", error.message);
            return { ok: false, message: error.message };
        }
    }

    /**
     * Generate a JWT token for Jitsi meeting access
     * @param {string} webnarId - The ID of the webinar
     * @param {string} userId - The ID of the user requesting access
     * @param {number} bufferMinutes - Extra minutes to add to token expiration (default: 30)
     * @param {Object} customClaims - Additional claims to include in the JWT
     * @returns {Object} Response containing token and meeting details or error
     */
    async generateJitsiToken(webnarId, userId, bufferMinutes = 30, customClaims = {}) {
        try {
            // Get webinar with populated allowedClusters
            const webnar = await WebnarModel.findById(webnarId)
                .populate('allowedClusters')
                .populate('participants.user');
            
            if (!webnar) {
                return { ok: false, message: "Webinar not found" };
            }
            
            // Get user with populated clusters
            const user = await UserModel.findById(userId).populate('ministry department');
            
            if (!user) {
                return { ok: false, message: "User not found" };
            }
            
            // Check user eligibility
            const isParticipant = webnar.participants.some(p => p.user._id.toString() === userId);
            const isAllowedByClusters = webnar.allowedClusters.some(cluster => {
                // Check if user belongs to this cluster (based on your cluster membership logic)
                // This is a placeholder - adjust according to your application's logic
                return (
                    user.ministry && cluster.ministry === user.ministry ||
                    user.department && cluster.department === user.department
                );
            });
            const isSpeaker = webnar.speaker && webnar.speaker.toString() === userId;
            
            if (!isParticipant && !isAllowedByClusters && !isSpeaker) {
                return { ok: false, message: "User is not eligible to join this webinar" };
            }
            
            // Generate room name using webinar ID (ensuring it's URL-friendly)
            const roomName = `webinar_${webnarId.toString().replace(/[^a-zA-Z0-9]/g, '_')}`;
            
            // Determine token expiration
            const now = new Date();
            let expTime;
            
            if (now < webnar.startTime) {
                // If webinar hasn't started, token expires at end time + buffer
                expTime = new Date(webnar.endTime);
                expTime.setMinutes(expTime.getMinutes() + bufferMinutes);
            } else if (now > webnar.endTime) {
                // If webinar has ended, token expires in short buffer time (for late access)
                expTime = new Date();
                expTime.setMinutes(expTime.getMinutes() + bufferMinutes);
            } else {
                // During the webinar, token expires at end time + buffer
                expTime = new Date(webnar.endTime);
                expTime.setMinutes(expTime.getMinutes() + bufferMinutes);
            }
            
            // Calculate expiration in seconds from now (for JWT)
            const expiresIn = Math.floor((expTime - now) / 1000);
            
            // Prepare JWT payload for Jitsi
            const jitsiPayload = {
                context: {
                    user: {
                        id: userId,
                        name: user.username || "Anonymous",
                        email: user.email || "",
                        avatar: user.profilePicture || "",
                        role: isSpeaker ? "moderator" : "participant"
                    },
                    room: {
                        id: roomName,
                        name: webnar.title
                    }
                },
                aud: "jitsi", // Audience
                iss: "4bcreation", // Issuer
                sub: "meet.jitsi", // Subject
                room: roomName,
                exp: Math.floor(Date.now() / 1000) + expiresIn,
                ...customClaims
            };
            
            // Generate the token
            const token = jwt.sign(jitsiPayload, jwtSecret);
            
            // Update participant record with attendance information
            if (isParticipant && !isSpeaker) {
                // Find participant in the array
                const participantIndex = webnar.participants.findIndex(
                    p => p.user._id.toString() === userId
                );
                
                if (participantIndex !== -1) {
                    // Update attendance info
                    webnar.participants[participantIndex].attended = true;
                    webnar.participants[participantIndex].attendanceTime = now;
                    
                    // Save the updated webinar
                    await webnar.save();
                }
            }
            
            return {
                ok: true,
                data: {
                    token,
                    roomName,
                    webinarTitle: webnar.title,
                    userRole: isSpeaker ? "moderator" : "participant",
                    expiresAt: expTime,
                    startTime: webnar.startTime,
                    endTime: webnar.endTime
                },
                message: "Jitsi token generated successfully"
            };
        } catch (error) {
            console.log("Error generating Jitsi token:", error.message);
            return { ok: false, message: error.message };
        }
    }
}

module.exports = new WebnarController(); 