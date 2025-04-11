const express = require('express');
const ClusterController = require("../controller/cluster.controller");
// const { isAuthenticated, isAuthorized } = require("../middleware/auth"); // If needed

// Swagger Definitions for Cluster - Adapt based on cluster.model.js
/**
 * @swagger
 * components:
 *   schemas:
 *     Cluster:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated unique identifier
 *         name:
 *           type: string
 *           description: Name of the cluster (should be unique)
 *           unique: true
 *         description:
 *           type: string
 *           description: Optional description for the cluster
 *         webinars: # Assuming this holds references to webinars
 *           type: array
 *           items:
 *             type: string # Assuming ObjectId references to Webinar documents
 *             description: ID of a webinar belonging to this cluster
 *           description: List of webinars associated with this cluster
 *         webinarCount: # Dynamically added field via controller
 *             type: integer
 *             description: Count of webinars in this cluster (added via query option)
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ClusterResponse:
 *       type: object
 *       properties:
 *         ok:
 *           type: boolean
 *           description: Operation success status
 *         data:
 *           oneOf:
 *             - $ref: '#/components/schemas/Cluster'
 *             - type: array
 *               items:
 *                 $ref: '#/components/schemas/Cluster'
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
   * /api/v1/clusters:
   *   post:
   *     summary: Create a new cluster
   *     description: Create a new cluster for grouping webinars
   *     tags: [Clusters]
   *     // security: 
   *     //  - bearerAuth: [] # If admin only
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Cluster'
   *     responses:
   *       201:
   *         description: Cluster created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ClusterResponse'
   *       400:
   *         description: Invalid input data or cluster name already exists
   *       401/403:
   *         description: Unauthorized/Forbidden
   */
  // Add middleware: isAuthenticated, isAuthorized(['ADMIN'])
  api.post("/", async (req, res) => {
    try {
      const body = req.body;
      const { ok, data, message } = await ClusterController.createCluster(body);
      if (!ok) {
          // Specific status code for duplicate key error
          return res.status(message.includes('already exists') ? 409 : 400).json({ ok, message });
      }
      res.status(201).json({ ok, data, message });
    } catch (error) {
      // Catch unexpected errors
      res.status(500).json({ ok: false, message: error.message });
    }
  });

  /**
   * @swagger
   * /api/v1/clusters:
   *   get:
   *     summary: Get all clusters
   *     description: Retrieve a list of clusters with filters, pagination, and optional webinar details
   *     tags: [Clusters]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema: { type: integer, default: 1 }
   *       - in: query
   *         name: limit
   *         schema: { type: integer, default: 50 }
   *       - in: query
   *         name: sort
   *         schema: { type: string, example: name:1 }
   *         description: Sort order (e.g., name:1 for A-Z, name:-1 for Z-A)
   *       - in: query
   *         name: name
   *         schema: { type: string }
   *         description: Filter by cluster name (exact match or use regex in controller if needed)
   *       - in: query
   *         name: select
   *         schema: { type: string, example: name description }
   *         description: Select specific fields (space-separated)
   *       - in: query
   *         name: populate
   *         schema: { type: string, enum: [webinars] }
   *         description: Populate associated webinars
   *       - in: query
   *         name: countWebinars
   *         schema: { type: boolean }
   *         description: Include a count of associated webinars
   *     responses:
   *       200:
   *         description: Successfully retrieved clusters
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ClusterResponse'
   *       500:
   *         description: Server error
   */
  api.get("/", async (req, res) => {
    try {
      const { page, limit, sort, select, populate, countWebinars, ...filter } = req.query;
      const options = { page, limit, sort, select, populate, countWebinars: countWebinars === 'true' };
      if (options.sort) {
          const parts = options.sort.split(':');
          options.sort = { [parts[0]]: parseInt(parts[1]) };
      } else {
           options.sort = { name: 1 }; // Default sort
      }
      const { ok, data, pagination, message } = await ClusterController.getClusters(filter, options);
      if (ok) {
        res.status(200).json({ ok, message, data, pagination });
      } else {
        res.status(500).json({ ok, message });
      }
    } catch (error) {
      res.status(500).json({ ok: false, message: error.message });
    }
  });

  /**
   * @swagger
   * /api/v1/clusters/{id}:
   *   get:
   *     summary: Get cluster by ID
   *     description: Retrieve a specific cluster, optionally populating/counting webinars
   *     tags: [Clusters]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *         description: Cluster ID
   *       - in: query
   *         name: populate
   *         schema: { type: string, enum: [webinars] }
   *         description: Populate associated webinars
   *       - in: query
   *         name: countWebinars
   *         schema: { type: boolean }
   *         description: Include a count of associated webinars
   *     responses:
   *       200:
   *         description: Cluster retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ClusterResponse'
   *       404:
   *         description: Cluster not found
   *       500:
   *         description: Server error
   */
  api.get("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { populate, countWebinars } = req.query;
      const options = { populate, countWebinars: countWebinars === 'true' };
      const { ok, data, message } = await ClusterController.getClusterById(id, options);
      if (ok) {
        res.status(200).json({ ok, message, data });
      } else {
        res.status(message === "Cluster not found" ? 404 : 500).json({ ok, message });
      }
    } catch (error) {
      res.status(500).json({ ok: false, message: error.message });
    }
  });

  /**
   * @swagger
   * /api/v1/clusters/{id}:
   *   put:
   *     summary: Update a cluster
   *     description: Update details of an existing cluster (e.g., name, description)
   *     tags: [Clusters]
   *     // security:
   *     //   - bearerAuth: [] # If admin only
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *         description: Cluster ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *             # Exclude webinars array from direct update via this route
   *     responses:
   *       200:
   *         description: Cluster updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ClusterResponse'
   *       404:
   *         description: Cluster not found
   *       400:
   *         description: Invalid update data (e.g., validation error)
   *       409:
   *         description: Conflict - Cluster name already exists
   *       401/403:
   *         description: Unauthorized/Forbidden
   *       500:
   *         description: Server error
   */
  // Add middleware: isAuthenticated, isAuthorized(['ADMIN'])
  api.put("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const body = req.body;
      // Controller already prevents webinar array updates

      const { ok, data, message } = await ClusterController.updateCluster(id, body);
      if (ok) {
          if (data) {
              res.status(200).json({ ok, message, data });
          } else {
              // Should be caught by controller check, but handle just in case
              res.status(404).json({ ok: false, message: message || "Cluster not found" });
          }
      } else {
        let statusCode = 400; // Default bad request
        if (message.includes('not found')) statusCode = 404;
        if (message.includes('already exists')) statusCode = 409; // Conflict
        res.status(statusCode).json({ ok, message });
      }
    } catch (error) {
      res.status(500).json({ ok: false, message: error.message });
    }
  });

  /**
   * @swagger
   * /api/v1/clusters/{id}:
   *   delete:
   *     summary: Delete a cluster
   *     description: Remove a cluster record. Fails if the cluster still has associated webinars.
   *     tags: [Clusters]
   *     // security:
   *     //  - bearerAuth: [] # If admin only
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *         description: Cluster ID
   *     responses:
   *       200:
   *         description: Cluster deleted successfully
   *         content:
   *           application/json:
   *             schema: { type: object, properties: { ok: { type: boolean }, message: { type: string } } }
   *       400:
   *         description: Cannot delete cluster because it still has webinars associated.
   *       404:
   *         description: Cluster not found
   *       401/403:
   *         description: Unauthorized/Forbidden
   *       500:
   *         description: Server error
   */
  // Add middleware: isAuthenticated, isAuthorized(['ADMIN'])
  api.delete("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { ok, data, message } = await ClusterController.deleteCluster(id);
      if (ok) {
          if(data) {
            res.status(200).json({ ok, message }); // Or 204 No Content
          } else {
             // Should be caught by controller check
            res.status(404).json({ ok: false, message: message || "Cluster not found" });
          }
      } else {
         // Handle specific error from controller (cannot delete if webinars exist)
         let statusCode = 500;
         if (message.includes('Cannot delete cluster')) statusCode = 400; // Bad Request
         if (message.includes('not found')) statusCode = 404; // Not Found
         res.status(statusCode).json({ ok, message });
      }
    } catch (error) {
      res.status(500).json({ ok: false, message: error.message });
    }
  });

  return api;
}; 