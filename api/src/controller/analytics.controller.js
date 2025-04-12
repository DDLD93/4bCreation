const AnalyticsModel = require("../model/analytics.model");
const WebinarModel = require("../model/webnar.model");
const CertificateModel = require("../model/certificate.model");
const redisCtrl = require("./redis.controller"); // Keep if needed for caching/specific logic, remove otherwise
const emailController = require("./email.controller"); // Keep if needed for notifications, remove otherwise
const jwt = require("jsonwebtoken"); // Keep if auth logic is needed per analytics item, remove otherwise
const { jwtSecret } = require("../config"); // Keep if auth logic is needed, remove otherwise
const mongoose = require("mongoose");

class AnalyticsController {
  constructor() {
  }

  async createAnalytics(body) {
    try {
      const newAnalytics = new AnalyticsModel(body);
      await newAnalytics.save();
      return {
        ok: true,
        data: newAnalytics,
        message: "Analytics record created successfully",
      };
    } catch (error) {
      console.log("Error creating analytics record:", error.message);
      // Consider adding specific error handling if needed (e.g., duplicate keys)
      return { ok: false, message: error.message };
    }
  }

  async getAnalytics(filter = {}, options = {}) {
    try {
      // Extract pagination parameters with defaults
      const page = parseInt(options.page) || 1;
      const limit = parseInt(options.limit) || 50;
      const skip = (page - 1) * limit;

      // Extract sorting parameters
      const sort = options.sort || { createdAt: -1 }; // Default sort by creation date

      // Count total documents for pagination metadata
      const total = await AnalyticsModel.countDocuments(filter);

      // Get paginated results
      const analyticsRecords = await AnalyticsModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit);

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      return {
        ok: true,
        data: analyticsRecords,
        pagination: {
          total,
          totalPages,
          currentPage: page,
          limit,
          hasNext,
          hasPrev
        },
        message: `Found ${analyticsRecords.length} analytics records (page ${page} of ${totalPages})`
      };
    } catch (error) {
      console.log("Error fetching analytics records:", error.message);
      return { ok: false, message: error.message };
    }
  }

  async getAnalyticsById(id) {
    try {
      const analyticsRecord = await AnalyticsModel.findById(id);
      if (!analyticsRecord) {
        return { ok: false, message: "Analytics record not found" };
      }
      return { ok: true, data: analyticsRecord, message: "Analytics record retrieved successfully" };
    } catch (error) {
      console.log("Error retrieving analytics record:", error.message);
      return { ok: false, message: error.message };
    }
  }

  async updateAnalytics(id, newData) {
    try {
      // Add { new: true } to return the updated document
      const updatedRecord = await AnalyticsModel.findByIdAndUpdate(id, newData, { new: true });
      return { ok: true, data: updatedRecord, message: updatedRecord ? "Analytics record updated successfully" : "Analytics record not found" };
    } catch (error) {
      console.log("Error updating analytics record:", error.message);
      return { ok: false, message: error.message };
    }
  }

  async deleteAnalytics(id) {
    try {
      const deletedRecord = await AnalyticsModel.findByIdAndDelete(id);
      return { ok: true, data: deletedRecord, message: deletedRecord ? "Analytics record deleted successfully" : "Analytics record not found" };
    } catch (error) {
      console.log("Error deleting analytics record:", error.message);
      return { ok: false, message: error.message };
    }
  }

  async getWebinarSummaryAnalytics(userId = null) {
    try {
      const today = new Date();
      
      // Base query for upcoming webinars
      const upcomingQuery = { 
        startTime: { $gt: today },
        status: 'approved'
      };
      
      // Base query for completed webinars
      const completedQuery = { 
        endTime: { $lt: today },
        status: 'completed'
      };

      // If userId is provided, filter by user participation
      if (userId) {
        upcomingQuery['participants.user'] = userId;
        completedQuery['participants.user'] = userId;
      }

      // Get upcoming webinars
      const upcomingWebinars = await WebinarModel.find(upcomingQuery)
        .sort({ startTime: 1 })
        .select('title description startTime endTime speaker tags');

      // Get completed webinars
      const completedWebinars = await WebinarModel.find(completedQuery)
        .sort({ endTime: -1 })
        .select('title description startTime endTime speaker recordingUrl');

      // Get certificates if userId is provided
      let certificates = [];
      if (userId) {
        certificates = await CertificateModel.find({ user: userId })
          .populate('webinar', 'title startTime')
          .select('certificateId certificateUrl metadata.score metadata.completionDate');
      }
      
      // Get featured/highlighted webinars (top upcoming webinars based on participant count)
      const featuredWebinars = await WebinarModel.find({
        startTime: { $gt: today },
        status: 'approved'
      })
      .sort({ participantCount: -1 })
      .limit(5)
      .select('title description startTime endTime speaker tags participantCount');

      return {
        ok: true,
        data: {
          upcomingWebinars,
          completedWebinars,
          certificates,
          featuredWebinars
        },
        message: "Webinar summary analytics retrieved successfully"
      };
    } catch (error) {
      console.log("Error retrieving webinar summary analytics:", error.message);
      return { ok: false, message: error.message };
    }
  }

  async getWebinarHoursPerMonth(userId = null, months = 12) {
    try {
      const match = {
        status: 'completed'
      };

      // If userId is provided, filter by user who attended
      if (userId) {
        match['participants'] = {
          $elemMatch: {
            user: mongoose.Types.ObjectId(userId),
            attended: true
          }
        };
      }

      // Calculate date range for the past X months
      const today = new Date();
      const endDate = new Date(today);
      const startDate = new Date(today);
      startDate.setMonth(today.getMonth() - (months - 1));
      startDate.setDate(1); // First day of the start month
      endDate.setDate(31); // Ensure we get to the end of the current month
      
      match.endTime = { $gte: startDate, $lte: endDate };

      const pipeline = [
        { $match: match },
        {
          $project: {
            monthYear: { 
              $dateToString: { format: "%Y-%m", date: "$endTime" } 
            },
            month: { $month: '$endTime' },
            year: { $year: '$endTime' },
            duration: { 
              $divide: [
                { $subtract: ['$endTime', '$startTime'] }, 
                3600000 // Convert milliseconds to hours
              ]
            },
            participants: 1
          }
        },
        {
          $group: {
            _id: { monthYear: '$monthYear', month: '$month', year: '$year' },
            totalHours: { $sum: '$duration' },
            webinarCount: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        },
        {
          $project: {
            monthYear: '$_id.monthYear',
            month: '$_id.month',
            year: '$_id.year',
            totalHours: { $round: ['$totalHours', 1] },
            webinarCount: 1,
            _id: 0
          }
        }
      ];

      if (userId) {
        // For individual users, we use their watch duration instead of webinar duration
        pipeline[1] = {
          $unwind: '$participants'
        };
        
        pipeline.splice(2, 0, {
          $match: {
            'participants.user': mongoose.Types.ObjectId(userId),
            'participants.attended': true
          }
        });
        
        pipeline[3] = {
          $project: {
            monthYear: { 
              $dateToString: { format: "%Y-%m", date: "$endTime" } 
            },
            month: { $month: '$endTime' },
            year: { $year: '$endTime' },
            duration: { 
              $divide: ['$participants.watchDuration', 3600] // Convert seconds to hours
            }
          }
        };
      }

      const monthlyHours = await WebinarModel.aggregate(pipeline);

      // Generate list of all months in the past 12 months
      const result = [];
      for (let i = 0; i < months; i++) {
        const monthDate = new Date(today);
        monthDate.setMonth(today.getMonth() - i);
        
        const year = monthDate.getFullYear();
        const month = monthDate.getMonth() + 1; // JavaScript months are 0-indexed
        const monthYear = `${year}-${month.toString().padStart(2, '0')}`;
        
        const monthData = monthlyHours.find(m => m.monthYear === monthYear);
        result.unshift(monthData || {
          monthYear,
          month,
          year,
          totalHours: 0,
          webinarCount: 0
        });
      }

      return {
        ok: true,
        data: result,
        message: `Monthly webinar hours for the past ${months} months retrieved successfully`
      };
    } catch (error) {
      console.log("Error retrieving monthly webinar hours:", error.message);
      return { ok: false, message: error.message };
    }
  }

  async getWebinarReminders(userId = null) {
    try {
      const now = new Date();
      
      // Base query for upcoming reminders in the next 7 days
      const query = {
        startTime: { 
          $gt: now, 
          $lt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) 
        },
        status: 'approved'
      };
      
      // If userId is provided, filter by user participation
      if (userId) {
        query['participants.user'] = userId;
      }
      
      // Get upcoming reminders
      const upcomingReminders = await WebinarModel.find(query)
        .select('title description startTime endTime speaker tags')
        .sort({ startTime: 1 });

      return {
        ok: true,
        data: upcomingReminders,
        message: `Found ${upcomingReminders.length} upcoming webinar reminders`
      };
    } catch (error) {
      console.log("Error retrieving webinar reminders:", error.message);
      return { ok: false, message: error.message };
    }
  }

  async getFeaturedWebinars(limit = 5) {
    try {
      const now = new Date();
      
      // Get upcoming webinars sorted by participant count (most popular first)
      const featuredWebinars = await WebinarModel.find({
        startTime: { $gt: now },
        status: 'approved'
      })
      .sort({ participantCount: -1 })
      .limit(limit)
      .select('title description startTime endTime speaker tags participantCount materials');

      return {
        ok: true,
        data: featuredWebinars,
        message: `Found ${featuredWebinars.length} featured webinars`
      };
    } catch (error) {
      console.log("Error retrieving featured webinars:", error.message);
      return { ok: false, message: error.message };
    }
  }

  // Add other analytics-specific methods if needed

  // Helper methods like encodeToken/decodeToken might not be needed here
  // unless there's specific logic requiring them within this controller.
  // handleDuplicateKeyError might be useful if specific unique fields exist in AnalyticsModel
}

module.exports = new AnalyticsController(); 