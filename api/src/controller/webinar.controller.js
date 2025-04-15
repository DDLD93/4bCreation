const webinarModel = require("../model/webinar.model"); // Corrected filename
const ClusterModel = require("../model/cluster.model"); // Needed for potential cluster updates
const UserModel = require("../model/user.model"); // Needed for user validation
const jwt = require("jsonwebtoken");
const { jitsiUrl, jitsiApiKey } = require("../config");

class webinarController {
  constructor() {
  }

  async createwebinar(body) {
    try {
      const newwebinar = new webinarModel(body);
      await newwebinar.save();
      
      // Optional: If creating a webinar should update the associated cluster
      if (newwebinar.cluster) {
         await ClusterModel.findByIdAndUpdate(newwebinar.cluster, { $addToSet: { webinars: newwebinar._id } });
      }
      
      return {
        ok: true,
        data: newwebinar,
        message: "Webinar created successfully",
      };
    } catch (error) {
      console.log("Error creating webinar:", error.message);
      return { ok: false, message: error.message };
    }
  }

  async getwebinars(filter = {}, options = {}) {
    try {
      const page = parseInt(options.page) || 1;
      const limit = parseInt(options.limit) || 50;
      const skip = (page - 1) * limit;
      const sort = options.sort || { startTime: 1 }; // Default sort by start time ascending

      let query = webinarModel.find(filter);

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

      const total = await webinarModel.countDocuments(filter);
      // Re-apply time filter to countDocuments if necessary for accurate total
       let countFilter = { ...filter };
       if (options.timeFilter === 'upcoming') {
           countFilter.startTime = { $gte: now };
       } else if (options.timeFilter === 'past') {
           countFilter.startTime = { $lt: now };
       }
      const filteredTotal = await webinarModel.countDocuments(countFilter);

      const webinars = await query.exec();

      // Use filteredTotal for pagination if timeFilter is applied
      const paginationTotal = options.timeFilter ? filteredTotal : total; 
      const totalPages = Math.ceil(paginationTotal / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      return {
        ok: true,
        data: webinars,
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
        message: `Found ${webinars.length} webinars (page ${page} of ${totalPages})`
      };
    } catch (error) {
      console.log("Error fetching webinars:", error.message);
      return { ok: false, message: error.message };
    }
  }

  async getwebinarById(id, options = {}) {
    try {
      let query = webinarModel.findById(id);
      if (options.populate) {
          query = query.populate(options.populate);
      }
      const webinar = await query.exec();
      if (!webinar) {
        return { ok: false, message: "Webinar not found" };
      }
      return { ok: true, data: webinar, message: "Webinar retrieved successfully" };
    } catch (error) {
      console.log("Error retrieving webinar:", error.message);
      return { ok: false, message: error.message };
    }
  }

  async updatewebinar(id, newData) {
    try {
      // Handle potential cluster change: remove from old, add to new
      const oldwebinar = await webinarModel.findById(id).select('cluster');
      const oldClusterId = oldwebinar ? oldwebinar.cluster : null;
      const newClusterId = newData.cluster;

      const updatedwebinar = await webinarModel.findByIdAndUpdate(id, newData, { new: true, runValidators: true });

      if (updatedwebinar) {
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
      
      return { ok: true, data: updatedwebinar, message: updatedwebinar ? "Webinar updated successfully" : "Webinar not found" };
    } catch (error) {
      console.log("Error updating webinar:", error.message);
      return { ok: false, message: error.message };
    }
  }

  async deletewebinar(id) {
    try {
      // Also remove webinar reference from its cluster
      const deletedwebinar = await webinarModel.findByIdAndDelete(id);
      if (deletedwebinar && deletedwebinar.cluster) {
          await ClusterModel.findByIdAndUpdate(deletedwebinar.cluster, { $pull: { webinars: deletedwebinar._id } });
      }
      // TODO: Consider deleting related Quizzes, Interactions, etc. or handle via hooks.
      return { ok: true, data: deletedwebinar, message: deletedwebinar ? "Webinar deleted successfully" : "Webinar not found" };
    } catch (error) {
      console.log("Error deleting webinar:", error.message);
      return { ok: false, message: error.message };
    }
  }

  // Add specific methods: register user, unregister user, get attendees, etc.
    async registerUserForwebinar(webinarId, userId) {
        try {
            const updatedwebinar = await webinarModel.findByIdAndUpdate(
                webinarId,
                { $addToSet: { attendees: userId } }, // Use $addToSet to avoid duplicates
                { new: true }
            );
            if (!updatedwebinar) return { ok: false, message: "Webinar not found" };
            // TODO: Add interaction log if needed
            return { ok: true, data: updatedwebinar, message: "User registered successfully" };
        } catch (error) {
            console.log("Error registering user for webinar:", error.message);
            return { ok: false, message: error.message };
        }
    }

    async unregisterUserFromwebinar(webinarId, userId) {
        try {
            const updatedwebinar = await webinarModel.findByIdAndUpdate(
                webinarId,
                { $pull: { attendees: userId } },
                { new: true }
            );
             if (!updatedwebinar) return { ok: false, message: "Webinar not found" };
            // TODO: Add interaction log if needed
            return { ok: true, data: updatedwebinar, message: "User unregistered successfully" };
        } catch (error) {
            console.log("Error unregistering user from webinar:", error.message);
            return { ok: false, message: error.message };
        }
    }

    /**
     * Generate a JWT token for Jitsi meeting access
     * @param {string} webinarId - The ID of the webinar
     * @param {string} userId - The ID of the user requesting access
     * @param {number} bufferMinutes - Extra minutes to add to token expiration (default: 30)
     * @param {Object} customClaims - Additional claims to include in the JWT
     * @returns {Object} Response containing token and meeting details or error
     */
    async joinWebinar(webinarId, userId, bufferMinutes = 30, customClaims = {}) {
        try {
            // Get webinar with populated allowedClusters
            const webinar = await webinarModel.findById(webinarId)
                .populate('allowedClusters')
                .populate('participants.user');
            
            if (!webinar) {
                return { ok: false, message: "Webinar not found" };
            }
            
            // Get user with populated clusters
            const user = await UserModel.findById(userId).populate('ministry department');
            const roomName  = `${jitsiApiKey}/${webinar._id}`;
            
            if (!user) {
                return { ok: false, message: "User not found" };
            }
            
            // Check user eligibility
            const isParticipant = webinar.participants.some(p => p.user._id.toString() === userId);
            const isAllowedByClusters = webinar.allowedClusters.some(cluster => {
                // Check if user belongs to this cluster (based on your cluster membership logic)
                // This is a placeholder - adjust according to your application's logic
                return (
                    user.ministry && cluster.ministry === user.ministry ||
                    user.department && cluster.department === user.department
                );
            });
            const isSpeaker = webinar.speaker && webinar.speaker.toString() === userId;
            
            if (!isParticipant && !isAllowedByClusters && !isSpeaker) {
                return { ok: false, message: "User is not eligible to join this webinar" };
            }
            
            // Generate room name using webinar ID (ensuring it's URL-friendly)
            
            // Determine token expiration
            const now = new Date();
            let expTime;
            
            if (now < webinar.startTime) {
                // If webinar hasn't started, token expires at end time + buffer
                expTime = new Date(webinar.endTime);
                expTime.setMinutes(expTime.getMinutes() + bufferMinutes);
            } else if (now > webinar.endTime) {
                // If webinar has ended, token expires in short buffer time (for late access)
                expTime = new Date();
                expTime.setMinutes(expTime.getMinutes() + bufferMinutes);
            } else {
                // During the webinar, token expires at end time + buffer
                expTime = new Date(webinar.endTime);
                expTime.setMinutes(expTime.getMinutes() + bufferMinutes);
            }
            
            // Calculate expiration in seconds from now (for JWT)
            const expiresIn = Math.floor((expTime - now) / 1000);

            const token = this.generateJitsiToken(jitsiApiKey, { id: userId, name: user.fullName, email: user.email, avatar: user.picture, appId: webinar._id, kid: webinar._id, roomName });	
            
            // Update participant record with attendance information
            if (isParticipant && !isSpeaker) {
                // Find participant in the array
                const participantIndex = webinar.participants.findIndex(
                    p => p.user._id.toString() === userId
                );
                
                if (participantIndex !== -1) {
                    // Update attendance info
                    webinar.participants[participantIndex].attended = true;
                    webinar.participants[participantIndex].attendanceTime = now;
                    
                    // Save the updated webinar
                    await webinar.save();
                }
            }
            
            return {
                ok: true,
                data: {
                    token,
                    roomName,
                    webinarTitle: webinar.title,
                    userRole: isSpeaker ? "moderator" : "participant",
                    expiresAt: expTime,
                    startTime: webinar.startTime,
                    endTime: webinar.endTime,
                    jitsiUrl
                    
                },
                message: "Jitsi token generated successfully"
            };
        } catch (error) {
            console.log("Error generating Jitsi token:", error.message);
            return { ok: false, message: error.message };
        }
    }

     generateJitsiToken(privateKey, { id, name, email, avatar, appId, kid, roomName }) {
      const now = new Date()
      const token = jwt.sign({
        aud: 'jitsi',
        context: {
          user: {
            id,
            name,
            avatar,
            email: email,
            moderator: 'true'
          },
          features: {
            livestreaming: 'true',
            recording: 'true',
            transcription: 'true',
            "outbound-call": 'true'
          }
        },
        iss: 'chat',
        room: roomName || '*',
        sub: appId,
        exp: Math.round(now.setHours(now.getHours() + 3) / 1000),
        nbf: (Math.round((new Date).getTime() / 1000) - 10)
      }, privateKey, { algorithm: 'RS256', header: { kid } })
      return token;
    }
}

module.exports = new webinarController(); 