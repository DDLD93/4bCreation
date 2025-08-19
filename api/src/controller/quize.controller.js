const QuizeModel = require("../model/quize.model"); // Corrected filename
const QuizeAttemptModel = require("../model/quizeAttempt.model"); // Add QuizAttempt model

class QuizeController {
  constructor() {
  }

  async createQuize(body) {
    try {
      const newQuize = new QuizeModel(body);
      await newQuize.save();
      return {
        ok: true,
        data: newQuize,
        message: "Quiz created successfully",
      };
    } catch (error) {
      console.log("Error creating quiz:", error.message);
      // Add specific error handling (e.g., validation)
      return { ok: false, message: error.message };
    }
  }

  async getQuizes(filter = {}, options = {}) {
    try {
      const page = parseInt(options.page) || 1;
      const limit = parseInt(options.limit) || 50;
      const skip = (page - 1) * limit;
      const sort = options.sort || { createdAt: -1 };

      // Base query
      let query = QuizeModel.find(filter);

      // Select specific fields if provided
      if (options.select) {
        query = query.select(options.select);
      }

      // Add sorting, skip, and limit
      query = query.sort(sort).skip(skip).limit(limit);

      // Optionally populate related fields
      if (options.populate) {
        query = query.populate(options.populate); // e.g., populate 'cluster' or 'webinar'
      }

      const total = await QuizeModel.countDocuments(filter);
      const quizes = await query.exec(); // Execute the query

      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      return {
        ok: true,
        data: quizes,
        pagination: {
          total,
          totalPages,
          currentPage: page,
          limit,
          hasNext,
          hasPrev
        },
        message: `Found ${quizes.length} quizzes (page ${page} of ${totalPages})`
      };
    } catch (error) {
      console.log("Error fetching quizzes:", error.message);
      return { ok: false, message: error.message };
    }
  }

  async getQuizeById(id, options = {}) {
    try {
      let query = QuizeModel.findById(id);

      // Optionally populate related fields
      if (options.populate) {
        query = query.populate(options.populate); // e.g., populate 'cluster' or 'webinar'
      }

      const quize = await query.exec();

      if (!quize) {
        return { ok: false, message: "Quiz not found" };
      }
      return { ok: true, data: quize, message: "Quiz retrieved successfully" };
    } catch (error) {
      console.log("Error retrieving quiz:", error.message);
      return { ok: false, message: error.message };
    }
  }

  async updateQuize(id, newData) {
    try {
      const updatedQuize = await QuizeModel.findByIdAndUpdate(id, newData, { new: true, runValidators: true });
      return { ok: true, data: updatedQuize, message: updatedQuize ? "Quiz updated successfully" : "Quiz not found" };
    } catch (error) {
      console.log("Error updating quiz:", error.message);
      // Handle validation errors specifically if needed
      return { ok: false, message: error.message };
    }
  }

  async deleteQuize(id) {
    try {
      // Consider implications: deleting a quiz might orphan attempts. Soft delete might be better.
      const deletedQuize = await QuizeModel.findByIdAndDelete(id);
      // TODO: Optionally delete related QuizAttempts? Or handle via middleware/hooks.
      return { ok: true, data: deletedQuize, message: deletedQuize ? "Quiz deleted successfully" : "Quiz not found" };
    } catch (error) {
      console.log("Error deleting quiz:", error.message);
      return { ok: false, message: error.message };
    }
  }

  // Add specific methods like adding/removing questions, publishing/unpublishing, etc.
  async addQuestionToQuize(quizId, questionData) {
    try {
      const updatedQuiz = await QuizeModel.findByIdAndUpdate(
        quizId,
        { $push: { questions: questionData } },
        { new: true, runValidators: true }
      );
      if (!updatedQuiz) return { ok: false, message: "Quiz not found" };
      return { ok: true, data: updatedQuiz, message: "Question added successfully" };
    } catch (error) {
      console.log("Error adding question to quiz:", error.message);
      return { ok: false, message: error.message };
    }
  }

  async removeQuestionFromQuize(quizId, questionId) {
    try {
      const updatedQuiz = await QuizeModel.findByIdAndUpdate(
        quizId,
        { $pull: { questions: { _id: questionId } } }, // Assumes questions have _id
        { new: true }
      );
      if (!updatedQuiz) return { ok: false, message: "Quiz not found" };
      return { ok: true, data: updatedQuiz, message: "Question removed successfully" };
    } catch (error) {
      console.log("Error removing question from quiz:", error.message);
      return { ok: false, message: error.message };
    }
  }

  async getQuizesByWebinar(webinarId, userId) {
    try {
      // Find all quizzes for the specified webinar
      const quize = await QuizeModel.findOne({ webinar: webinarId });
      
      if (!quize) {
        return { 
          ok: true, 
          data: null, 
          message: "No quize found for this webinar" 
        };
      }
      
      // If no userId provided, return basic quiz data
      if (!userId) {
        return {
          ok: true,
          data: quize,
          message: `Quize found for the webinar`
        };
      }
      
      // Process the quiz to include user attempt data
      const enhancedQuiz = await quize.getWithUserAttempts(userId);
      return {
        ok: true,
        data: enhancedQuiz,
        message: `Quize found for the webinar`
      };
    } catch (error) {
      console.log("Error retrieving quize by webinar:", error.message);
      return { ok: false, message: error.message };
    }
  }
}

module.exports = new QuizeController(); 