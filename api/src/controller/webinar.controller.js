const webinarModel = require("../model/webinar.model");
const ClusterModel = require("../model/cluster.model");
const UserModel = require("../model/user.model");
const jwt = require("jsonwebtoken");
const { jitsiUrl, jitsiApiKey } = require("../config");
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const app = require('express')();
const puppeteer = require('puppeteer');

class webinarController {
  constructor() {}


  async generateCertificate(webinarId, userId) {
    try {
      const webinar = await webinarModel.findById(webinarId);
      if (!webinar) {
        return { ok: false, message: "Webinar not found" };
      }
      const user = await UserModel.findById(userId);
      if (!user) {
        return { ok: false, message: "User not found" };
      }
      const backgroundFilePath = path.join(__dirname, 'layout.png');

      let backgroundBase64 = '';
      try {
          const imageData = fs.readFileSync(backgroundFilePath);
          backgroundBase64 = `data:image/png;base64,${imageData.toString('base64')}`;
      } catch (error) {
          console.error('Error reading background image:', error);
          backgroundBase64 = '';
      }

      // Render the EJS template to HTML
      const html = await app.render('certificate', {
          name: user.fullName,
          background: backgroundBase64
      });

      const htmlContent = await ejs.renderFile(path.join(__dirname, 'certificate.ejs'), {
        name: user.fullName,
        background: backgroundBase64
      });

      // Launch Puppeteer
      const browser = await puppeteer.launch({
          headless: 'new',
          args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();

      // Set content and wait for fonts to load
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      // Wait a bit for fonts to render
      await page.waitForTimeout(1000);

      // Generate PDF with A4 dimensions
      const pdf = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: {
              top: '0',
              right: '0',
              bottom: '0',
              left: '0'
          }
      });

      await browser.close();
      return { ok: true, data: pdf, message: "Certificate generated successfully" };
    } catch (error) {
      console.log("Error generating certificate:", error.message);
      return { ok: false, message: error.message };
    }
  }

  async createwebinar(body) {
    try {
      const newwebinar = new webinarModel(body);
      await newwebinar.save();

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
      const sort = options.sort || { startTime: 1 };

      let query = webinarModel.find(filter);

      if (options.select) {
        query = query.select(options.select);
      }

      query = query.sort(sort).skip(skip).limit(limit);

      if (options.populate) {
        query = query.populate(options.populate);
      }

      const now = new Date();
      if (options.timeFilter === 'upcoming') {
        query = query.where('startTime').gte(now);
        if (!options.sort) query = query.sort({ startTime: 1 });
      } else if (options.timeFilter === 'past') {
        query = query.where('startTime').lt(now);
        if (!options.sort) query = query.sort({ startTime: -1 });
      }

      const total = await webinarModel.countDocuments(filter);
      let countFilter = { ...filter };
      if (options.timeFilter === 'upcoming') {
        countFilter.startTime = { $gte: now };
      } else if (options.timeFilter === 'past') {
        countFilter.startTime = { $lt: now };
      }
      const filteredTotal = await webinarModel.countDocuments(countFilter);

      const webinars = await query.exec();

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
      const updatedwebinar = await webinarModel.findByIdAndUpdate(id, newData, { new: true, runValidators: true });

      return { ok: true, data: updatedwebinar, message: updatedwebinar ? "Webinar updated successfully" : "Webinar not found" };
    } catch (error) {
      console.log("Error updating webinar:", error.message);
      return { ok: false, message: error.message };
    }
  }

  async deletewebinar(id) {
    try {
      const deletedwebinar = await webinarModel.findByIdAndDelete(id);

      return { ok: true, data: deletedwebinar, message: deletedwebinar ? "Webinar deleted successfully" : "Webinar not found" };
    } catch (error) {
      console.log("Error deleting webinar:", error.message);
      return { ok: false, message: error.message };
    }
  }

  async addParticipantsWebinar(webinarId, userIds) {
    try {
      // Validate webinarId
      if (!mongoose.Types.ObjectId.isValid(webinarId)) {
        return { ok: false, message: "Invalid Webinar ID format" };
      }

      // Ensure userIds is an array
      const userIdArray = Array.isArray(userIds) ? userIds : [userIds];
      
      // Validate all userIds
      for (const userId of userIdArray) {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
          return { ok: false, message: `Invalid User ID format: ${userId}` };
        }
      }

      // Fetch webinar
      const webinar = await webinarModel.findById(webinarId).select('participants maxCapacity participantCount');
      if (!webinar) return { ok: false, message: "Webinar not found" };

      // Check capacity
      if (webinar.participantCount + userIdArray.length > webinar.maxCapacity) {
        return { 
          ok: false, 
          message: `Webinar cannot accommodate all users. Current capacity: ${webinar.participantCount}/${webinar.maxCapacity}, Attempting to add: ${userIdArray.length}`
        };
      }

      // Filter out already registered users
      const existingUserIds = webinar.participants.map(p => p.user.toString());
      const newUserIds = userIdArray.filter(id => !existingUserIds.includes(id));
      
      if (newUserIds.length === 0) {
        return { ok: true, data: webinar, message: "All users are already registered" };
      }

      // Create participant objects for each new user
      const now = new Date();
      const newParticipants = newUserIds.map(userId => ({
        user: userId,
        registered: now
      }));

      // Update webinar with new participants
      const updatedwebinar = await webinarModel.findByIdAndUpdate(
        webinarId,
        {
          $push: { participants: { $each: newParticipants } }
        },
        { new: true, runValidators: true }
      ).populate('participants.user');

      if (!updatedwebinar) return { ok: false, message: "Webinar not found during update" };

      return { 
        ok: true, 
        data: updatedwebinar, 
        message: `Successfully registered ${newUserIds.length} users for the webinar`
      };
    } catch (error) {
      console.log("Error registering users for webinar:", error.message);
      return { ok: false, message: error.message };
    }
  }

  async removeParticipantsFromWebinar(webinarId, userIds) {
    try {
      // Validate webinarId
      if (!mongoose.Types.ObjectId.isValid(webinarId)) {
        return { ok: false, message: "Invalid Webinar ID format" };
      }

      // Ensure userIds is an array
      const userIdArray = Array.isArray(userIds) ? userIds : [userIds];
      
      // Validate all userIds
      for (const userId of userIdArray) {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
          return { ok: false, message: `Invalid User ID format: ${userId}` };
        }
      }

      // Fetch webinar to check if it exists
      const webinar = await webinarModel.findById(webinarId);
      if (!webinar) return { ok: false, message: "Webinar not found" };

      // Remove all specified users from participants
      const updatedwebinar = await webinarModel.findByIdAndUpdate(
        webinarId,
        {
          $pull: { participants: { user: { $in: userIdArray } } }
        },
        { new: true }
      );

      return { 
        ok: true, 
        data: updatedwebinar, 
        message: `Successfully unregistered users from the webinar`
      };
    } catch (error) {
      console.log("Error unregistering users from webinar:", error.message);
      return { ok: false, message: error.message };
    }
  }


  async joinWebinar(webinarId, userId, bufferMinutes = 30, customClaims = {}) {
    try {
      const webinar = await webinarModel.findById(webinarId)
        .populate('clusters')
        .populate('participants.user');

      if (!webinar) {
        return { ok: false, message: "Webinar not found" };
      }

      const user = await UserModel.findById(userId);

      if (!user) {
        return { ok: false, message: "User not found" };
      }

      const isSpeaker = webinar.speaker && webinar.speaker.toString() === userId;
      const isParticipant = webinar.participants.some(p => p.user._id.toString() === userId);

      let isAllowedByClusters = false;
      if (webinar.clusters && webinar.clusters.length > 0) {
        const clusterIds = webinar.clusters.map(c => c._id);
        const matchingClusterCount = await ClusterModel.countDocuments({
          _id: { $in: clusterIds },
          members: userId
        });
        isAllowedByClusters = matchingClusterCount > 0;
      }

      // if (!isParticipant && !isAllowedByClusters && !isSpeaker) {
      //   return { ok: false, message: "User is not eligible to join this webinar" };
      // }

      const roomName = `${jitsiApiKey}/${webinar._id}`;

      const now = new Date();
      let expTime;

      if (now < webinar.startTime) {
        expTime = new Date(webinar.endTime);
        expTime.setMinutes(expTime.getMinutes() + bufferMinutes);
      } else if (now > webinar.endTime) {
        expTime = new Date();
        expTime.setMinutes(expTime.getMinutes() + bufferMinutes);
      } else {
        expTime = new Date(webinar.endTime);
        expTime.setMinutes(expTime.getMinutes() + bufferMinutes);
      }

      const expiresIn = Math.floor((expTime - now) / 1000);

      const userRole = isSpeaker ? "moderator" : "participant";

      const token = this.generateJitsiToken(jitsiApiKey, {
        id: userId,
        name: user.fullName,
        email: user.email,
        avatar: user.picture,
        appId: webinar._id.toString(),
        roomName: roomName,
        isModerator: userRole === "moderator"
      });

      const participantIndex = webinar.participants.findIndex(
        p => p.user._id.toString() === userId
      );

      if (participantIndex !== -1 && !webinar.participants[participantIndex].attended) {
        webinar.participants[participantIndex].attended = true;
        webinar.participants[participantIndex].attendanceTime = now;
        await webinar.save();
      } else if (participantIndex === -1 && isAllowedByClusters && !isSpeaker) {
        webinar.participants.push({
          user: userId,
          registered: now,
          attended: true,
          attendanceTime: now
        });
        await webinar.save();
      }

      return {
        ok: true,
        data: {
          token,
          roomName,
          webinarTitle: webinar.title,
          userRole: userRole,
          expiresAt: expTime,
          startTime: webinar.startTime,
          endTime: webinar.endTime,
          jitsiUrl
        },
        message: "Jitsi token generated successfully"
      };
    } catch (error) {
      console.log("Error generating Jitsi token:", error.message);
      if (error instanceof jwt.JsonWebTokenError) {
        return { ok: false, message: "Failed to generate meeting token." };
      }
      return { ok: false, message: error.message || "An unexpected error occurred while joining the webinar." };
    }
  }

  generateJitsiToken(privateKey, { id, name, email, avatar, appId, kid, roomName, isModerator }) {
    const now = new Date();
    const headerKid = kid || `vpaas-magic-cookie-${appId}/${id}`;

    const token = jwt.sign({
      aud: 'jitsi',
      context: {
        user: {
          id,
          name,
          avatar,
          email: email,
          moderator: isModerator ? 'true' : 'false'
        },
      },
      iss: 'chat',
      room: roomName || '*',
      sub: appId,
      exp: Math.round(now.setHours(now.getHours() + 3) / 1000),
      nbf: (Math.round(Date.now() / 1000) - 10)
    }, privateKey, { header: { kid: headerKid } });
    return token;
  }
}

module.exports = new webinarController();