const AdminModel = require("../model/admin.model");
const UserModel = require("../model/user.model");
const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config");

class AdminController {
  constructor() {
  }

  // Create a new admin (requires an existing user)
  async createAdmin(body) {
    try {
      // Check if user exists and has appropriate role
      const userId = body.user;
      const user = await UserModel.findById(userId);
      
      if (!user) {
        throw new Error("User not found");
      }
      
      // Update user role to admin if not already
      if (user.role !== 'admin') {
        await UserModel.findByIdAndUpdate(userId, { role: 'admin' });
      }
      
      // Check if admin record already exists for this user
      const existingAdmin = await AdminModel.findOne({ user: userId });
      if (existingAdmin) {
        throw new Error("Admin record already exists for this user");
      }
      
      // Create new admin record
      const newAdmin = new AdminModel(body);
      await newAdmin.save();
      
      // Populate user information
      const adminWithUser = await AdminModel.findById(newAdmin._id).populate('user', '-password');
      
      return {
        ok: true,
        data: adminWithUser,
        message: "Admin created successfully"
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Get all admins with pagination and filtering
  async getAdmins(filter = {}, options = {}) {
    try {
      // Extract pagination parameters with defaults
      const page = parseInt(options.page) || 1;
      const limit = parseInt(options.limit) || 50;
      const skip = (page - 1) * limit;
      
      // Extract sorting parameters
      const sort = options.sort || { createdAt: -1 }; // Default sort by creation date
      
      // Count total documents for pagination metadata
      const total = await AdminModel.countDocuments(filter);
      
      // Get paginated results with user information
      const admins = await AdminModel.find(filter)
        .populate('user', '-password')
        .sort(sort)
        .skip(skip)
        .limit(limit);
      
      // Calculate pagination metadata
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;
      
      return {
        ok: true,
        data: admins,
        pagination: {
          total,
          totalPages,
          currentPage: page,
          limit,
          hasNext,
          hasPrev
        },
        message: `Found ${admins.length} admins (page ${page} of ${totalPages})`
      };
    } catch (error) {
      console.log("Error fetching admins:", error.message);
      return { ok: false, message: error.message };
    }
  }

  // Get admin by ID
  async getAdminById(id) {
    try {
      const admin = await AdminModel.findById(id).populate('user', '-password');
      if (!admin) {
        return { ok: false, message: "Admin not found" };
      }
      return { ok: true, data: admin, message: "Admin retrieved successfully" };
    } catch (error) {
      console.log("Error getting admin:", error.message);
      return { ok: false, message: error.message };
    }
  }

  // Get admin by user ID
  async getAdminByUserId(userId) {
    try {
      const admin = await AdminModel.findOne({ user: userId }).populate('user', '-password');
      if (!admin) {
        return { ok: false, message: "Admin not found for this user" };
      }
      return { ok: true, data: admin, message: "Admin retrieved successfully" };
    } catch (error) {
      console.log("Error getting admin by user ID:", error.message);
      return { ok: false, message: error.message };
    }
  }

  // Update admin
  async updateAdmin(id, updateData) {
    try {
      const admin = await AdminModel.findByIdAndUpdate(id, updateData, { 
        new: true, 
        runValidators: true 
      }).populate('user', '-password');
      
      if (!admin) {
        return { ok: false, message: "Admin not found" };
      }
      
      // Update last activity timestamp
      admin.lastActivity = new Date();
      await admin.save();
      
      return { ok: true, data: admin, message: "Admin updated successfully" };
    } catch (error) {
      console.log("Error updating admin:", error.message);
      return { ok: false, message: error.message };
    }
  }

  // Update admin permissions
  async updatePermissions(id, permissions) {
    try {
      const admin = await AdminModel.findById(id);
      
      if (!admin) {
        return { ok: false, message: "Admin not found" };
      }
      
      admin.permissions = permissions;
      admin.lastActivity = new Date();
      await admin.save();
      
      const updatedAdmin = await AdminModel.findById(id).populate('user', '-password');
      
      return { ok: true, data: updatedAdmin, message: "Admin permissions updated successfully" };
    } catch (error) {
      console.log("Error updating admin permissions:", error.message);
      return { ok: false, message: error.message };
    }
  }

  // Delete admin (optionally revert user role)
  async deleteAdmin(id, revertUserRole = false) {
    try {
      const admin = await AdminModel.findById(id);
      
      if (!admin) {
        return { ok: false, message: "Admin not found" };
      }
      
      // Get user ID before deleting admin
      const userId = admin.user;
      
      // Delete admin record
      await AdminModel.findByIdAndDelete(id);
      
      // Optionally revert user role back to participant
      if (revertUserRole) {
        await UserModel.findByIdAndUpdate(userId, { role: 'participant' });
      }
      
      return { ok: true, message: "Admin deleted successfully" };
    } catch (error) {
      console.log("Error deleting admin:", error.message);
      return { ok: false, message: error.message };
    }
  }

  // Check if admin has specific permission
  async hasPermission(adminId, permission) {
    try {
      const admin = await AdminModel.findById(adminId);
      
      if (!admin) {
        return { ok: false, message: "Admin not found" };
      }
      
      // Full access permission grants all access
      if (admin.permissions.includes('full_access')) {
        return { ok: true, data: true, message: "Admin has full access" };
      }
      
      const hasPermission = admin.permissions.includes(permission);
      
      return { 
        ok: true, 
        data: hasPermission, 
        message: hasPermission ? 
          `Admin has ${permission} permission` : 
          `Admin does not have ${permission} permission` 
      };
    } catch (error) {
      console.log("Error checking admin permission:", error.message);
      return { ok: false, message: error.message };
    }
  }

  // Handle errors
  handleError(error) {
    console.log("Admin controller error:", error.message);
    
    // Handle duplicate key errors
    if (error.code === 11000 || error.message.includes('duplicate')) {
      return { 
        ok: false, 
        message: "Duplicate entry. This admin record already exists." 
      };
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return { 
        ok: false, 
        message: messages.join(', ') 
      };
    }
    
    return { ok: false, message: error.message };
  }
}

module.exports = new AdminController(); 