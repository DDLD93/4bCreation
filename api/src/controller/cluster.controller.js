const ClusterModel = require("../model/cluster.model");
// const WebnarModel = require("../model/webnar.model"); // For potential cleanup if needed

class ClusterController {
  constructor() {
  }

  async createCluster(body) {
    try {
      const newCluster = new ClusterModel(body);
      await newCluster.save();
      return {
        ok: true,
        data: newCluster,
        message: "Cluster created successfully",
      };
    } catch (error) {
      console.log("Error creating cluster:", error.message);
      // Handle duplicate key errors if name is unique
      if (error.code === 11000) {
          return { ok: false, message: `Cluster with name '${body.name}' already exists.` };
      }
      return { ok: false, message: error.message };
    }
  }

  async getClusters(filter = {}, options = {}) {
    try {
      const page = parseInt(options.page) || 1;
      const limit = parseInt(options.limit) || 50;
      const skip = (page - 1) * limit;
      const sort = options.sort || { name: 1 }; // Default sort by name ascending

      let query = ClusterModel.find(filter);

      if (options.select) {
          query = query.select(options.select);
      }
      
      query = query.sort(sort).skip(skip).limit(limit);

      // Option to populate webinars associated with the cluster
      if (options.populate === 'webinars') {
          query = query.populate('webinars'); // Populate the webinars field
      } else if (options.populate) {
          // Handle other potential population needs if they arise
          query = query.populate(options.populate);
      }
      
      // Optionally count associated webinars without full population
      if (options.countWebinars) {
           query = query.addFields({ webinarCount: { $size: "$webinars" } });
      }

      const total = await ClusterModel.countDocuments(filter);
      const clusters = await query.exec();

      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      return {
        ok: true,
        data: clusters,
        pagination: {
          total,
          totalPages,
          currentPage: page,
          limit,
          hasNext,
          hasPrev
        },
        message: `Found ${clusters.length} clusters (page ${page} of ${totalPages})`
      };
    } catch (error) {
      console.log("Error fetching clusters:", error.message);
      return { ok: false, message: error.message };
    }
  }

  async getClusterById(id, options = {}) {
    try {
      let query = ClusterModel.findById(id);
      
       // Option to populate webinars associated with the cluster
      if (options.populate === 'webinars') {
          query = query.populate('webinars'); // Populate the webinars field
      } else if (options.populate) {
          query = query.populate(options.populate);
      }
      
      // Optionally count associated webinars without full population
      if (options.countWebinars) {
           query = query.addFields({ webinarCount: { $size: "$webinars" } });
      }

      const cluster = await query.exec();
      
      if (!cluster) {
        return { ok: false, message: "Cluster not found" };
      }
      return { ok: true, data: cluster, message: "Cluster retrieved successfully" };
    } catch (error) {
      console.log("Error retrieving cluster:", error.message);
      return { ok: false, message: error.message };
    }
  }

  async updateCluster(id, newData) {
    try {
      // Ensure webinars array is not directly overwritten if provided
      delete newData.webinars;
      
      const updatedCluster = await ClusterModel.findByIdAndUpdate(id, newData, { new: true, runValidators: true });
      return { ok: true, data: updatedCluster, message: updatedCluster ? "Cluster updated successfully" : "Cluster not found" };
    } catch (error) {
      console.log("Error updating cluster:", error.message);
       if (error.code === 11000) {
          return { ok: false, message: `Cluster name update failed, name likely already exists.` };
      }
      return { ok: false, message: error.message };
    }
  }

  async deleteCluster(id) {
    try {
      // IMPORTANT: Decide how to handle webinars associated with the deleted cluster.
      // Option 1: Delete associated webinars (cascade delete - potentially dangerous)
      // Option 2: Set cluster field to null in associated webinars
      // Option 3: Prevent deletion if cluster has webinars
      
      const cluster = await ClusterModel.findById(id);
      if (!cluster) {
          return { ok: false, message: "Cluster not found" };
      }
      
      if (cluster.webinars && cluster.webinars.length > 0) {
          // Option 3 implementation: Prevent deletion
           return { ok: false, message: `Cannot delete cluster '${cluster.name}' because it has associated webinars. Please reassign or delete them first.` };
           
          // Option 2 implementation: Nullify reference in Webinars (requires WebnarModel)
          // await WebnarModel.updateMany({ cluster: id }, { $set: { cluster: null } });
      }
      
      const deletedCluster = await ClusterModel.findByIdAndDelete(id);
      
      return { ok: true, data: deletedCluster, message: deletedCluster ? "Cluster deleted successfully" : "Cluster not found" };
    } catch (error) {
      console.log("Error deleting cluster:", error.message);
      return { ok: false, message: error.message };
    }
  }

  // Specific methods could include adding/removing webinars explicitly, 
  // but this is handled by the Webinar controller currently.
}

module.exports = new ClusterController(); 