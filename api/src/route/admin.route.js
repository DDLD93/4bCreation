const express = require('express');
const AdminController = require("../controller/admin.controller");
// Uncomment when adding auth middleware
// const { isAuthenticated, isAuthorized } = require("../middleware/auth");

/**
 * @swagger
 * components:
 *   schemas:
 *     Admin:
 *       type: object
 *       required:
 *         - user
 *         - department
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated unique identifier
 *         user:
 *           type: string
 *           description: Reference to User model
 *         permissions:
 *           type: array
 *           items:
 *             type: string
 *             enum: [manage_users, manage_content, manage_quizes, manage_webnars, manage_certificates, view_analytics, full_access]
 *           description: List of admin permissions
 *         adminLevel:
 *           type: string
 *           enum: [junior, senior, super]
 *           description: Level of admin privileges
 *           default: junior
 *         department:
 *           type: string
 *           description: Department the admin belongs to
 *         dashboardAccess:
 *           type: boolean
 *           description: Whether admin has access to dashboard
 *           default: true
 *         canManageAdmins:
 *           type: boolean
 *           description: Whether admin can manage other admins
 *           default: false
 *         lastActivity:
 *           type: string
 *           format: date-time
 *           description: Timestamp of last admin activity
 *         notes:
 *           type: string
 *           description: Additional notes about the admin
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of record creation
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of last update
 *     AdminResponse:
 *       type: object
 *       properties:
 *         ok:
 *           type: boolean
 *           description: Operation success status
 *         data:
 *           oneOf:
 *             - $ref: '#/components/schemas/Admin'
 *             - type: array
 *               items:
 *                 $ref: '#/components/schemas/Admin'
 *             - type: null
 *         message:
 *           type: string
 *           description: Response message
 *         pagination:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *             totalPages:
 *               type: integer
 *             currentPage:
 *               type: integer
 *             limit:
 *               type: integer
 *             hasNext:
 *               type: boolean
 *             hasPrev:
 *               type: boolean
 */

module.exports = () => {
  const api = express.Router();

  /**
   * @swagger
   * /api/v1/admin:
   *   post:
   *     summary: Create a new admin
   *     description: Create a new admin account linked to an existing user
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - user
   *               - department
   *             properties:
   *               user:
   *                 type: string
   *                 description: User ID to link admin account to
   *               permissions:
   *                 type: array
   *                 items:
   *                   type: string
   *                   enum: [manage_users, manage_content, manage_quizes, manage_webnars, manage_certificates, view_analytics, full_access]
   *               adminLevel:
   *                 type: string
   *                 enum: [junior, senior, super]
   *               department:
   *                 type: string
   *               dashboardAccess:
   *                 type: boolean
   *               canManageAdmins:
   *                 type: boolean
   *               notes:
   *                 type: string
   *     responses:
   *       201:
   *         description: Admin created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AdminResponse'
   *       400:
   *         description: Invalid input data or duplicate entry
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - insufficient permissions
   */
  // Add auth middleware when ready: isAuthenticated, isAuthorized(['admin', 'super'])
  api.post("/", async (req, res) => {
    try {
      const body = req.body;
      const { ok, data, message } = await AdminController.createAdmin(body);
      if (!ok) throw new Error(message);
      res.status(201).json({ ok, data, message });
    } catch (error) {
      res.status(400).json({ ok: false, message: error.message });
    }
  });

  /**
   * @swagger
   * /api/v1/admin:
   *   get:
   *     summary: Get all admins
   *     description: Retrieve a list of all admin accounts with pagination and filtering
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Page number for pagination
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *         description: Number of records per page
   *       - in: query
   *         name: sort
   *         schema:
   *           type: string
   *           example: createdAt:-1
   *         description: Sort order (field:1 for ascending, field:-1 for descending)
   *       - in: query
   *         name: adminLevel
   *         schema:
   *           type: string
   *           enum: [junior, senior, super]
   *         description: Filter by admin level
   *       - in: query
   *         name: department
   *         schema:
   *           type: string
   *         description: Filter by department
   *     responses:
   *       200:
   *         description: Successfully retrieved admins
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AdminResponse'
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - insufficient permissions
   *       500:
   *         description: Server error
   */
  api.get("/", async (req, res) => {
    try {
      const { page, limit, sort, ...filter } = req.query;
      const options = { page, limit, sort };
      
      if (options.sort) {
        const parts = options.sort.split(':');
        options.sort = { [parts[0]]: parseInt(parts[1]) };
      } else {
        options.sort = { createdAt: -1 };
      }
      
      const { ok, data, pagination, message } = await AdminController.getAdmins(filter, options);
      
      if (ok) {
        res.status(200).json({ ok, data, pagination, message });
      } else {
        res.status(500).json({ ok, message });
      }
    } catch (error) {
      res.status(500).json({ ok: false, message: error.message });
    }
  });

  /**
   * @swagger
   * /api/v1/admin/{id}:
   *   get:
   *     summary: Get admin by ID
   *     description: Retrieve a specific admin by ID
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Admin ID
   *     responses:
   *       200:
   *         description: Successfully retrieved admin
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AdminResponse'
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - insufficient permissions
   *       404:
   *         description: Admin not found
   *       500:
   *         description: Server error
   */
  api.get("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { ok, data, message } = await AdminController.getAdminById(id);
      
      if (ok) {
        res.status(200).json({ ok, data, message });
      } else {
        res.status(data ? 500 : 404).json({ ok, message });
      }
    } catch (error) {
      res.status(500).json({ ok: false, message: error.message });
    }
  });

  /**
   * @swagger
   * /api/v1/admin/user/{userId}:
   *   get:
   *     summary: Get admin by user ID
   *     description: Retrieve admin information for a specific user
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *     responses:
   *       200:
   *         description: Successfully retrieved admin
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AdminResponse'
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - insufficient permissions
   *       404:
   *         description: Admin not found for this user
   *       500:
   *         description: Server error
   */
  api.get("/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { ok, data, message } = await AdminController.getAdminByUserId(userId);
      
      if (ok) {
        res.status(200).json({ ok, data, message });
      } else {
        res.status(data ? 500 : 404).json({ ok, message });
      }
    } catch (error) {
      res.status(500).json({ ok: false, message: error.message });
    }
  });

  /**
   * @swagger
   * /api/v1/admin/{id}:
   *   put:
   *     summary: Update admin
   *     description: Update an existing admin's information
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Admin ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               permissions:
   *                 type: array
   *                 items:
   *                   type: string
   *               adminLevel:
   *                 type: string
   *                 enum: [junior, senior, super]
   *               department:
   *                 type: string
   *               dashboardAccess:
   *                 type: boolean
   *               canManageAdmins:
   *                 type: boolean
   *               notes:
   *                 type: string
   *     responses:
   *       200:
   *         description: Admin updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AdminResponse'
   *       400:
   *         description: Invalid update data
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - insufficient permissions
   *       404:
   *         description: Admin not found
   *       500:
   *         description: Server error
   */
  api.put("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const { ok, data, message } = await AdminController.updateAdmin(id, updateData);
      
      if (ok) {
        res.status(200).json({ ok, data, message });
      } else {
        res.status(data ? 400 : 404).json({ ok, message });
      }
    } catch (error) {
      res.status(500).json({ ok: false, message: error.message });
    }
  });

  /**
   * @swagger
   * /api/v1/admin/{id}/permissions:
   *   patch:
   *     summary: Update admin permissions
   *     description: Update an admin's permissions
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Admin ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - permissions
   *             properties:
   *               permissions:
   *                 type: array
   *                 items:
   *                   type: string
   *                   enum: [manage_users, manage_content, manage_quizes, manage_webnars, manage_certificates, view_analytics, full_access]
   *     responses:
   *       200:
   *         description: Admin permissions updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AdminResponse'
   *       400:
   *         description: Invalid permissions data
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - insufficient permissions
   *       404:
   *         description: Admin not found
   *       500:
   *         description: Server error
   */
  api.patch("/:id/permissions", async (req, res) => {
    try {
      const { id } = req.params;
      const { permissions } = req.body;
      
      if (!permissions || !Array.isArray(permissions)) {
        return res.status(400).json({ 
          ok: false, 
          message: "Permissions must be provided as an array" 
        });
      }
      
      const { ok, data, message } = await AdminController.updatePermissions(id, permissions);
      
      if (ok) {
        res.status(200).json({ ok, data, message });
      } else {
        res.status(data ? 400 : 404).json({ ok, message });
      }
    } catch (error) {
      res.status(500).json({ ok: false, message: error.message });
    }
  });

  /**
   * @swagger
   * /api/v1/admin/{id}:
   *   delete:
   *     summary: Delete admin
   *     description: Delete an admin record (optionally revert user role)
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Admin ID
   *       - in: query
   *         name: revertUserRole
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Whether to revert the user's role to 'participant'
   *     responses:
   *       200:
   *         description: Admin deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AdminResponse'
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - insufficient permissions
   *       404:
   *         description: Admin not found
   *       500:
   *         description: Server error
   */
  api.delete("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const revertUserRole = req.query.revertUserRole === 'true';
      
      const { ok, message } = await AdminController.deleteAdmin(id, revertUserRole);
      
      if (ok) {
        res.status(200).json({ ok, message });
      } else {
        res.status(404).json({ ok, message });
      }
    } catch (error) {
      res.status(500).json({ ok: false, message: error.message });
    }
  });

  /**
   * @swagger
   * /api/v1/admin/{id}/check-permission:
   *   get:
   *     summary: Check admin permission
   *     description: Check if an admin has a specific permission
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Admin ID
   *       - in: query
   *         name: permission
   *         required: true
   *         schema:
   *           type: string
   *           enum: [manage_users, manage_content, manage_quizes, manage_webnars, manage_certificates, view_analytics, full_access]
   *         description: Permission to check
   *     responses:
   *       200:
   *         description: Permission check successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 ok:
   *                   type: boolean
   *                 data:
   *                   type: boolean
   *                   description: Whether admin has the permission
   *                 message:
   *                   type: string
   *       400:
   *         description: Missing or invalid permission parameter
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - insufficient permissions
   *       404:
   *         description: Admin not found
   *       500:
   *         description: Server error
   */
  api.get("/:id/check-permission", async (req, res) => {
    try {
      const { id } = req.params;
      const { permission } = req.query;
      
      if (!permission) {
        return res.status(400).json({ 
          ok: false, 
          message: "Permission parameter is required" 
        });
      }
      
      const { ok, data, message } = await AdminController.hasPermission(id, permission);
      
      if (ok) {
        res.status(200).json({ ok, data, message });
      } else {
        res.status(404).json({ ok, message });
      }
    } catch (error) {
      res.status(500).json({ ok: false, message: error.message });
    }
  });

  return api;
}; 