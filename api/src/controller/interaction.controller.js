const InteractionModel = require("../model/interaction.modal"); // Corrected filename

class InteractionController {
  constructor() {
  }

  async createInteraction(body) {
    try {
      const newInteraction = new InteractionModel(body);
      await newInteraction.save();
      return {
        ok: true,
        data: newInteraction,
        message: "Interaction created successfully",
      };
    } catch (error) {
      console.log("Error creating interaction:", error.message);
      return { ok: false, message: error.message };
    }
  }

  async getInteractions(filter = {}, options = {}) {
    try {
      const page = parseInt(options.page) || 1;
      const limit = parseInt(options.limit) || 50;
      const skip = (page - 1) * limit;
      const sort = options.sort || { createdAt: -1 }; 

      const total = await InteractionModel.countDocuments(filter);
      const interactions = await InteractionModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit);
        // Consider populating related fields like 'user', 'quiz', 'webinar' if needed
        // .populate('user') 
        // .populate('quiz')
        // .populate('webinar');

      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      return {
        ok: true,
        data: interactions,
        pagination: {
          total,
          totalPages,
          currentPage: page,
          limit,
          hasNext,
          hasPrev
        },
        message: `Found ${interactions.length} interactions (page ${page} of ${totalPages})`
      };
    } catch (error) {
      console.log("Error fetching interactions:", error.message);
      return { ok: false, message: error.message };
    }
  }

  async getInteractionById(id) {
    try {
      const interaction = await InteractionModel.findById(id);
        // .populate('user') 
        // .populate('quiz')
        // .populate('webinar');
      if (!interaction) {
        return { ok: false, message: "Interaction not found" };
      }
      return { ok: true, data: interaction, message: "Interaction retrieved successfully" };
    } catch (error) {
      console.log("Error retrieving interaction:", error.message);
      return { ok: false, message: error.message };
    }
  }

  async updateInteraction(id, newData) {
    try {
      const updatedInteraction = await InteractionModel.findByIdAndUpdate(id, newData, { new: true });
      return { ok: true, data: updatedInteraction, message: updatedInteraction ? "Interaction updated successfully" : "Interaction not found" };
    } catch (error) {
      console.log("Error updating interaction:", error.message);
      return { ok: false, message: error.message };
    }
  }

  async deleteInteraction(id) {
    try {
      const deletedInteraction = await InteractionModel.findByIdAndDelete(id);
      return { ok: true, data: deletedInteraction, message: deletedInteraction ? "Interaction deleted successfully" : "Interaction not found" };
    } catch (error) {
      console.log("Error deleting interaction:", error.message);
      return { ok: false, message: error.message };
    }
  }

  // Add other interaction-specific methods if needed
}

module.exports = new InteractionController(); 