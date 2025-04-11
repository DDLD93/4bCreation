const QuizeAttemptModel = require("../model/quizeAttempt.model");

class QuizeAttemptController {
  constructor() {
  }

  async createQuizeAttempt(body) {
    try {
      // Add validation if needed (e.g., check if user already attempted quiz)
      const newAttempt = new QuizeAttemptModel(body);
      await newAttempt.save();
      return {
        ok: true,
        data: newAttempt,
        message: "Quiz attempt recorded successfully",
      };
    } catch (error) {
      console.log("Error recording quiz attempt:", error.message);
      return { ok: false, message: error.message };
    }
  }

  async getQuizeAttempts(filter = {}, options = {}) {
    try {
      const page = parseInt(options.page) || 1;
      const limit = parseInt(options.limit) || 50;
      const skip = (page - 1) * limit;
      const sort = options.sort || { createdAt: -1 };

      const total = await QuizeAttemptModel.countDocuments(filter);
      const attempts = await QuizeAttemptModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        // Populate related fields like 'user' and 'quiz' for context
        .populate('user', 'fullName email') // Example: only select specific user fields
        .populate('quiz', 'title'); // Example: only select quiz title

      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      return {
        ok: true,
        data: attempts,
        pagination: {
          total,
          totalPages,
          currentPage: page,
          limit,
          hasNext,
          hasPrev
        },
        message: `Found ${attempts.length} quiz attempts (page ${page} of ${totalPages})`
      };
    } catch (error) {
      console.log("Error fetching quiz attempts:", error.message);
      return { ok: false, message: error.message };
    }
  }

  async getQuizeAttemptById(id) {
    try {
      const attempt = await QuizeAttemptModel.findById(id)
        .populate('user', 'fullName email') 
        .populate('quiz'); // Populate full quiz details maybe
      if (!attempt) {
        return { ok: false, message: "Quiz attempt not found" };
      }
      return { ok: true, data: attempt, message: "Quiz attempt retrieved successfully" };
    } catch (error) {
      console.log("Error retrieving quiz attempt:", error.message);
      return { ok: false, message: error.message };
    }
  }

  // Update might be complex (e.g., re-grading). Consider if needed.
  async updateQuizeAttempt(id, newData) {
    try {
      // Be careful about what fields are updatable (e.g., maybe only score or status)
      const updatedAttempt = await QuizeAttemptModel.findByIdAndUpdate(id, newData, { new: true });
      return { ok: true, data: updatedAttempt, message: updatedAttempt ? "Quiz attempt updated successfully" : "Quiz attempt not found" };
    } catch (error) {
      console.log("Error updating quiz attempt:", error.message);
      return { ok: false, message: error.message };
    }
  }

  // Delete might be unusual for attempts, consider soft delete or status change instead.
  async deleteQuizeAttempt(id) {
    try {
      const deletedAttempt = await QuizeAttemptModel.findByIdAndDelete(id);
      return { ok: true, data: deletedAttempt, message: deletedAttempt ? "Quiz attempt deleted successfully" : "Quiz attempt not found" };
    } catch (error) {
      console.log("Error deleting quiz attempt:", error.message);
      return { ok: false, message: error.message };
    }
  }

  // Add specific methods like getting attempts for a specific user or quiz
  async getUserAttemptsForQuiz(userId, quizId, options = {}) {
      const filter = { user: userId, quiz: quizId };
      return this.getQuizeAttempts(filter, options); 
  }
}

module.exports = new QuizeAttemptController(); 