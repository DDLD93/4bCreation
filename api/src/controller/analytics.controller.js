const AnalyticsModel = require("../model/analytics.model");
const redisCtrl = require("./redis.controller"); // Keep if needed for caching/specific logic, remove otherwise
const emailController = require("./email.controller"); // Keep if needed for notifications, remove otherwise
const jwt = require("jsonwebtoken"); // Keep if auth logic is needed per analytics item, remove otherwise
const { jwtSecret } = require("../config"); // Keep if auth logic is needed, remove otherwise

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

  // Add other analytics-specific methods if needed

  // Helper methods like encodeToken/decodeToken might not be needed here
  // unless there's specific logic requiring them within this controller.
  // handleDuplicateKeyError might be useful if specific unique fields exist in AnalyticsModel
}

module.exports = new AnalyticsController(); 