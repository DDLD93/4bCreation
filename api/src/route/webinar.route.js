const express = require('express');
const webinarController = require("../controller/webinar.controller");
// Assuming you might need authentication/authorization middleware
// const { isAuthenticated, isAuthorized } = require("../middleware/auth"); 

// Swagger Definitions for Webinar - Adapt based on webinar.model.js
/**
 * @swagger
 * components:
 *   schemas:
 *     webinar:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - startTime
 *         - durationMinutes
 *         - presenter
 *         - cluster
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated unique identifier
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         startTime:
 *           type: string
 *           format: date-time
 *           description: Scheduled start time of the webinar
 *         durationMinutes:
 *           type: number
 *           description: Duration of the webinar in minutes
 *         presenter: 
 *           type: string # Assuming presenter is linked by User ID
 *           description: User ID of the presenter
 *         cluster:
 *           type: string
 *           description: ID of the related cluster
 *         meetingLink:
 *           type: string
 *           format: url
 *           description: Link to the online meeting (Zoom, Meet, etc.)
 *         attendees:
 *           type: array
 *           items:
 *             type: string # User IDs
 *           description: List of registered attendees
 *         recordingUrl:
 *           type: string
 *           format: url
 *           description: Link to the webinar recording (if available)
 *         status:
 *           type: string
 *           enum: ['scheduled', 'live', 'completed', 'cancelled']
 *           default: 'scheduled'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     webinarResponse:
 *       type: object
 *       properties:
 *         ok:
 *           type: boolean
 *           description: Operation success status
 *         data:
 *           oneOf:
 *             - $ref: '#/components/schemas/webinar'
 *             - type: array
 *               items:
 *                 $ref: '#/components/schemas/webinar'
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
 *             grandTotal: # Optional, for filtered results
 *               type: integer
 */

module.exports = () => {
  const api = express.Router();

  /**
   * @swagger
   * /api/v1/webinars:
   *   post:
   *     summary: Create a new webinar
   *     description: Schedule a new webinar and associate it with a cluster
   *     tags: [webinars]
   *     // security:  # Add if requires authentication
   *     //   - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/webinar'
   *     responses:
   *       201:
   *         description: Webinar created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/webinarResponse'
   *       400:
   *         description: Invalid input data
   *       401:
   *         description: Unauthorized (if auth is required)
   */
  // Add middleware like isAuthenticated, isAuthorized(['ADMIN']) if needed
  api.post("/", async (req, res) => {
    try {
      const body = req.body;
      // Add user ID from auth token if presenter is the creator
      // body.presenter = req.user._id; 
      const { ok, data, message } = await webinarController.createwebinar(body);
      if (!ok) throw new Error(message);
      res.status(201).json({ ok, data, message });
    } catch (error) {
      res.status(400).json({ ok: false, message: error.message });
    }
  });

  /**
   * @swagger
   * /api/v1/webinars:
   *   get:
   *     summary: Get all webinars
   *     description: Retrieve a list of webinars with filters, pagination, and time filtering
   *     tags: [webinars]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema: { type: integer, default: 1 }
   *       - in: query
   *         name: limit
   *         schema: { type: integer, default: 50 }
   *       - in: query
   *         name: sort
   *         schema: { type: string, example: startTime:-1 }
   *       - in: query
   *         name: cluster
   *         schema: { type: string }
   *         description: Filter by cluster ID
   *       - in: query
   *         name: presenter
   *         schema: { type: string }
   *         description: Filter by presenter ID
   *       - in: query
   *         name: status
   *         schema: { type: string, enum: ['scheduled', 'live', 'completed', 'cancelled'] }
   *         description: Filter by status
   *       - in: query
   *         name: timeFilter
   *         schema: { type: string, enum: ['upcoming', 'past'] }
   *         description: Filter for upcoming or past webinars relative to now
   *       - in: query
   *         name: select
   *         schema: { type: string, example: title startTime presenter }
   *         description: Select specific fields (space-separated)
   *       - in: query
   *         name: populate
   *         schema: { type: string, example: cluster presenter }
   *         description: Populate related fields (space-separated)
   *     responses:
   *       200:
   *         description: Successfully retrieved webinars
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/webinarResponse'
   *       500:
   *         description: Server error
   */
  api.get("/", async (req, res) => {
    try {
      const { page, limit, sort, select, populate, timeFilter, ...filter } = req.query;
      const options = { page, limit, sort, select, populate, timeFilter };
      if (options.sort) {
          const parts = options.sort.split(':');
          options.sort = { [parts[0]]: parseInt(parts[1]) };
      } 
      // No default sort here, controller handles based on timeFilter

      const { ok, data, pagination, message } = await webinarController.getwebinars(filter, options);
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
   * /api/v1/webinars/{id}:
   *   get:
   *     summary: Get webinar by ID
   *     description: Retrieve a specific webinar, optionally populating relations
   *     tags: [webinars]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *         description: Webinar ID
   *       - in: query
   *         name: populate
   *         schema: { type: string, example: cluster presenter attendees }
   *         description: Populate related fields (space-separated)
   *     responses:
   *       200:
   *         description: Webinar retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/webinarResponse'
   *       404:
   *         description: Webinar not found
   *       500:
   *         description: Server error
   */
  api.get("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { populate } = req.query;
      const options = { populate };
      const { ok, data, message } = await webinarController.getwebinarById(id, options);
      if (ok) {
        res.status(200).json({ ok, message, data });
      } else {
        res.status(data ? 500 : 404).json({ ok, message });
      }
    } catch (error) {
      res.status(500).json({ ok: false, message: error.message });
    }
  });

  /**
   * @swagger
   * /api/v1/webinars/{id}:
   *   put:
   *     summary: Update a webinar
   *     description: Update details of an existing webinar
   *     tags: [webinars]
   *     // security:  # Add if requires authentication/authorization
   *     //   - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *         description: Webinar ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/webinar' // Allow full update, handle immutables
   *     responses:
   *       200:
   *         description: Webinar updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/webinarResponse'
   *       404:
   *         description: Webinar not found
   *       400:
   *         description: Invalid update data
   *       401/403:
   *         description: Unauthorized/Forbidden (if auth/authz needed)
   *       500:
   *         description: Server error
   */
  // Add middleware like isAuthenticated, isAuthorized(['ADMIN', 'PRESENTER']) if needed
  // Ensure presenter can only update their own webinar, or admin can update any
  api.put("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const body = req.body;
      delete body._id; delete body.createdAt; delete body.updatedAt; delete body.attendees; // Attendees managed separately

      // TODO: Add authorization check: req.user.role === 'ADMIN' || (req.user.role === 'PRESENTER' && webinar.presenter === req.user._id)

      const { ok, data, message } = await webinarController.updatewebinar(id, body);
      if (ok) {
          if (data) {
              res.status(200).json({ ok, message, data });
          } else {
              res.status(404).json({ ok: false, message: message || "Webinar not found" });
          }
      } else {
        res.status(message.includes('validation failed') ? 400 : 500).json({ ok, message });
      }
    } catch (error) {
      res.status(500).json({ ok: false, message: error.message });
    }
  });

  /**
   * @swagger
   * /api/v1/webinars/{id}:
   *   delete:
   *     summary: Delete a webinar
   *     description: Remove a webinar record
   *     tags: [webinars]
   *     // security:  # Add if requires authentication/authorization (e.g., Admin only)
   *     //   - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *         description: Webinar ID
   *     responses:
   *       200:
   *         description: Webinar deleted successfully
   *         content:
   *           application/json:
   *             schema: { type: object, properties: { ok: { type: boolean }, message: { type: string } } }
   *       404:
   *         description: Webinar not found
   *       401/403:
   *         description: Unauthorized/Forbidden
   *       500:
   *         description: Server error
   */
  // Add middleware like isAuthenticated, isAuthorized(['ADMIN']) if needed
  api.delete("/:id", async (req, res) => {
    try {
      const { id } = req.params;
       // TODO: Add authorization check: req.user.role === 'ADMIN'
      const { ok, data, message } = await webinarController.deletewebinar(id);
      if (ok) {
          if(data) {
            res.status(200).json({ ok, message }); // Or 204 No Content
          } else {
            res.status(404).json({ ok: false, message: message || "Webinar not found" });
          }
      } else {
        res.status(500).json({ ok, message });
      }
    } catch (error) {
      res.status(500).json({ ok: false, message: error.message });
    }
  });

  // --- Attendee Management Routes ---

  /**
   * @swagger
   * /api/v1/webinars/{id}/register:
   *   post:
   *     summary: Register for a webinar
   *     description: Add the authenticated user to the webinar's attendees list
   *     tags: [webinars]
   *     // security: 
   *     //   - bearerAuth: [] # Requires user to be logged in
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *         description: The ID of the webinar to register for
   *     responses:
   *       200:
   *         description: Successfully registered for the webinar
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/webinarResponse' } # Returns updated webinar
   *       400:
   *         description: Already registered or other issue
   *       401:
   *         description: Unauthorized (user not logged in)
   *       404:
   *         description: Webinar not found
   *       500:
   *         description: Server error
   */
   // Add middleware like isAuthenticated if needed
   api.post("/:id/register", async (req, res) => {
       try {
           const { id } = req.params;
           // const userId = req.user._id; // Get user ID from authentication token
           const userId = req.body.userId; // TEMPORARY: Get from body until auth is set up
            if (!userId) return res.status(400).json({ ok: false, message: "User ID is required for registration."}) 
            
           const { ok, data, message } = await webinarController.generateJitsiToken(id, userId);
           if (ok) {
               res.status(200).json({ ok, data, message });
           } else {
               res.status(message === "Webinar not found" ? 404 : 400).json({ ok, message });
           }
       } catch (error) {
           res.status(500).json({ ok: false, message: error.message });
       }
   });

  /**
   * @swagger
   * /api/v1/webinars/{id}/unregister:
   *   delete: # Using DELETE for unregistration action
   *     summary: Unregister from a webinar
   *     description: Remove the authenticated user from the webinar's attendees list
   *     tags: [webinars]
   *     // security:
   *     //   - bearerAuth: [] # Requires user to be logged in
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *         description: The ID of the webinar to unregister from
   *     responses:
   *       200:
   *         description: Successfully unregistered from the webinar
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/webinarResponse' } # Returns updated webinar
   *       400:
   *         description: Not registered or other issue
   *       401:
   *         description: Unauthorized (user not logged in)
   *       404:
   *         description: Webinar not found
   *       500:
   *         description: Server error
   */
   // Add middleware like isAuthenticated if needed
   api.delete("/:id/unregister", async (req, res) => {
       try {
           const { id } = req.params;
           // const userId = req.user._id; // Get user ID from authentication token
           const userId = req.body.userId; // TEMPORARY: Get from body until auth is set up
            if (!userId) return res.status(400).json({ ok: false, message: "User ID is required for unregistration."}) 
            
           const { ok, data, message } = await webinarController.unregisterUserFromwebinar(id, userId);
            if (ok) {
               res.status(200).json({ ok, data, message });
           } else {
               res.status(message === "Webinar not found" ? 404 : 400).json({ ok, message });
           }
       } catch (error) {
           res.status(500).json({ ok: false, message: error.message });
       }
   });

  /**
   * @swagger
   * /api/v1/webinars/{id}/jitsi-token:
   *   get:
   *     summary: Generate Jitsi meeting token
   *     description: Generate a JWT token for accessing a Jitsi meeting for this webinar
   *     tags: [webinars]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Webinar ID
   *       - in: query
   *         name: bufferMinutes
   *         schema:
   *           type: integer
   *           default: 30
   *         description: Buffer minutes to add to token expiration
   *     responses:
   *       200:
   *         description: Token generated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 ok:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     token:
   *                       type: string
   *                       description: JWT token for Jitsi
   *                     roomName:
   *                       type: string
   *                       description: Room name derived from webinar ID
   *                     webinarTitle:
   *                       type: string
   *                       description: Title of the webinar
   *                     userRole:
   *                       type: string
   *                       enum: [moderator, participant]
   *                       description: User's role in the meeting
   *                     expiresAt:
   *                       type: string
   *                       format: date-time
   *                       description: Token expiration timestamp
   *                     startTime:
   *                       type: string
   *                       format: date-time
   *                       description: Webinar start time
   *                     endTime:
   *                       type: string
   *                       format: date-time
   *                       description: Webinar end time
   *                 message:
   *                   type: string
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: User not eligible to join this webinar
   *       404:
   *         description: Webinar not found
   *       500:
   *         description: Server error
   */
  api.get("/:id/jitsi-token", async (req, res) => {
    try {
      const { id } = req.params;
      const bufferMinutes = parseInt(req.query.bufferMinutes) || 30;
      
      // Get user ID from auth token (assuming middleware sets req.user)
      // Adjust this according to your authentication setup
      const userId = req.user ? req.user._id : null;
      
      if (!userId) {
        return res.status(401).json({ 
          ok: false, 
          message: "Authentication required" 
        });
      }
      
      const { ok, data, message } = await webinarController.generateJitsiToken(id, userId, bufferMinutes);
      
      if (ok) {
        res.status(200).json({ ok, data, message });
      } else {
        // Return appropriate error code based on message
        if (message.includes("not found")) {
          res.status(404).json({ ok, message });
        } else if (message.includes("not eligible")) {
          res.status(403).json({ ok, message });
        } else {
          res.status(500).json({ ok, message });
        }
      }
    } catch (error) {
      res.status(500).json({ ok: false, message: error.message });
    }
  });

  return api;
}; 