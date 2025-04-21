const mongoose = require('mongoose');
const ClusterModel = require("../model/cluster.model");
const WebinarModel = require("../model/webinar.model");

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

      // Cannot populate 'webinars' directly as it's not on the Cluster model.
      // To get associated webinars, query WebinarModel separately: WebinarModel.find({ clusters: clusterId })
      if (options.populate) {
          // Handle other potential population needs (e.g., createdBy, members)
          query = query.populate(options.populate);
      }

      // Cannot count webinars directly via addFields as 'webinars' field doesn't exist.
      // To get count, query WebinarModel separately: WebinarModel.countDocuments({ clusters: clusterId })

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

       // Cannot populate 'webinars' directly as it's not on the Cluster model.
       // To get associated webinars, query WebinarModel separately: WebinarModel.find({ clusters: id })
      if (options.populate) {
          query = query.populate(options.populate);
      }

      // Cannot count webinars directly via addFields as 'webinars' field doesn't exist.
      // To get count, query WebinarModel separately: WebinarModel.countDocuments({ clusters: id })

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
      // Cluster model doesn't have a 'webinars' field, so no need to delete it from newData.
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

  async addClusterMembers(id, members) {
    try {
      // Validate cluster ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return { ok: false, message: "Invalid Cluster ID format" };
      }

      // Ensure members is an array
      const memberArray = Array.isArray(members) ? members : [members];
      
      // Validate all member IDs
      for (const memberId of memberArray) {
        if (!mongoose.Types.ObjectId.isValid(memberId)) {
          return { ok: false, message: `Invalid Member ID format: ${memberId}` };
        }
      }

      // Check if cluster exists
      const cluster = await ClusterModel.findById(id);
      if (!cluster) {
        return { ok: false, message: "Cluster not found" };
      }

      // Filter out members who are already in the cluster
      const existingMembers = cluster.members.map(m => m.toString());
      const newMembers = memberArray.filter(m => !existingMembers.includes(m));

      if (newMembers.length === 0) {
        return { ok: true, data: cluster, message: "All members are already in the cluster" };
      }

      // Add members to the cluster
      const updatedCluster = await ClusterModel.findByIdAndUpdate(
        id,
        { $addToSet: { members: { $each: newMembers } } },
        { new: true, runValidators: true }
      ).populate('members');

      return { 
        ok: true, 
        data: updatedCluster, 
        message: `Successfully added ${newMembers.length} members to the cluster` 
      };
    } catch (error) {
      console.log("Error adding cluster members:", error.message);
      return { ok: false, message: error.message };
    }
  }

  async removeClusterMembers(id, members) {
    try {
      // Validate cluster ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return { ok: false, message: "Invalid Cluster ID format" };
      }

      // Ensure members is an array
      const memberArray = Array.isArray(members) ? members : [members];
      
      // Validate all member IDs
      for (const memberId of memberArray) {
        if (!mongoose.Types.ObjectId.isValid(memberId)) {
          return { ok: false, message: `Invalid Member ID format: ${memberId}` };
        }
      }

      // Check if cluster exists first
      const cluster = await ClusterModel.findById(id);
      if (!cluster) {
        return { ok: false, message: "Cluster not found" };
      }

      const updatedCluster = await ClusterModel.findByIdAndUpdate(
        id,
        { $pull: { members: { $in: memberArray } } },
        { new: true, runValidators: true }
      );

      return { 
        ok: true, 
        data: updatedCluster, 
        message: `Successfully removed members from the cluster` 
      };
    } catch (error) {
      console.log("Error removing cluster members:", error.message);
      return { ok: false, message: error.message };
    }
  }

  // async addWebinarsToCluster(clusterId, webinarIds) {
  //   try {
  //     const updatedCluster = await ClusterModel.findByIdAndUpdate(
  //       clusterId,
  //       { $addToSet: { webinars: { $each: webinarIds } } },
  //       { new: true, runValidators: true }
  //     );

  //     if (!updatedCluster) {
  //       return { ok: false, message: "Cluster not found" };
  //     }

  //     return { ok: true, data: updatedCluster, message: "Webinars added successfully" };
  //   } catch (error) {
  //     console.log("Error adding webinars to cluster:", error.message);
  //     return { ok: false, message: error.message };
  //   }
  // }

  // Prevent deletion if cluster has associated webinars
  async deleteCluster(id) {
    try {
      const cluster = await ClusterModel.findById(id);
      if (!cluster) {
          return { ok: false, message: "Cluster not found" };
      }

      // Check if any webinar references this cluster in its 'clusters' array
      const webinarCount = await WebinarModel.countDocuments({ clusters: id });

      if (webinarCount > 0) {
          return { ok: false, message: `Cannot delete cluster '${cluster.name}' because it has ${webinarCount} associated webinar(s). Please reassign them first.` };
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