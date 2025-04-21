const express = require('express');
const webinarController = require("../controller/webinar.controller");
const { verifyToken } = require("../middleware/auth.middleware");

// Swagger Definitions for Webinar - Based on webinar.model.js
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
 *         - endTime
 *         - speaker
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated unique identifier
 *         title:
 *           type: string
 *           description: Title of the webinar
 *         description:
 *           type: string
 *           description: Detailed description of the webinar
 *         startTime:
 *           type: string
 *           format: date-time
 *           description: Scheduled start time of the webinar
 *         endTime:
 *           type: string
 *           format: date-time
 *           description: Scheduled end time of the webinar
 *         speaker:
 *           type: string
 *           description: User ID of the speaker
 *         status:
 *           type: string
 *           enum: ['pending', 'approved', 'completed', 'rejected', 'cancelled']
 *           default: 'pending'
 *           description: Current status of the webinar
 *         recordingUrl:
 *           type: string
 *           description: URL to the recording after webinar completion
 *         clusters:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of cluster IDs this webinar belongs to
 *         participants:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *                 description: User ID of the participant
 *               registered:
 *                 type: string
 *                 format: date-time
 *                 description: Registration timestamp
 *               attended:
 *                 type: boolean
 *                 description: Whether user attended the webinar
 *               attendanceTime:
 *                 type: string
 *                 format: date-time
 *                 description: Time user joined the webinar
 *               exitTime:
 *                 type: string
 *                 format: date-time
 *                 description: Time user left the webinar
 *         participantCount:
 *           type: integer
 *           description: Total number of registered participants
 *         maxCapacity:
 *           type: integer
 *           description: Maximum number of participants allowed
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Keywords associated with this webinar
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
 *             grandTotal:
 *               type: integer
 */

module.exports = () => {
  const api = express.Router();

  api.use(verifyToken);

  /**
   * @swagger
   * /api/v1/webinars:
   *   post:
   *     summary: Create a new webinar
   *     description: Schedule a new webinar and associate it with clusters
   *     tags: [Webinars]
   *     security:
   *       - bearerAuth: []
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
   *         description: Unauthorized
   */
  api.post("/", async (req, res) => {
    try {
      const body = req.body;
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
   *     tags: [Webinars]
   *     security:
   *       - bearerAuth: []
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
   *         name: clusters
   *         schema: { type: string }
   *         description: Filter by cluster ID
   *       - in: query
   *         name: speaker
   *         schema: { type: string }
   *         description: Filter by speaker ID
   *       - in: query
   *         name: status
   *         schema: { type: string, enum: ['pending', 'approved', 'completed', 'rejected', 'cancelled'] }
   *         description: Filter by status
   *       - in: query
   *         name: timeFilter
   *         schema: { type: string, enum: ['upcoming', 'past'] }
   *         description: Filter for upcoming or past webinars relative to now
   *       - in: query
   *         name: select
   *         schema: { type: string, example: title startTime speaker }
   *         description: Select specific fields (space-separated)
   *       - in: query
   *         name: populate
   *         schema: { type: string, example: clusters speaker }
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
   *     tags: [Webinars]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *         description: Webinar ID
   *       - in: query
   *         name: populate
   *         schema: { type: string, example: clusters speaker participants.user }
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
   *     tags: [Webinars]
   *     security:
   *       - bearerAuth: []
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
   *             $ref: '#/components/schemas/webinar'
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
   *       500:
   *         description: Server error
   */
  api.put("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const body = req.body;
      delete body._id; delete body.createdAt; delete body.updatedAt;

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
   *     tags: [Webinars]
   *     security:
   *       - bearerAuth: []
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
   *       500:
   *         description: Server error
   */
  api.delete("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { ok, data, message } = await webinarController.deletewebinar(id);
      if (ok) {
          if(data) {
            res.status(200).json({ ok, message });
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

  // --- Participant Management Routes ---

  /**
   * @swagger
   * /api/v1/webinars/{id}/participants:
   *   post:
   *     summary: Add participants to a webinar
   *     description: Register one or more users for a webinar
   *     tags: [Webinars]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *         description: The ID of the webinar
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               userIds:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Array of user IDs to register for the webinar
   *     responses:
   *       200:
   *         description: Successfully registered users for the webinar
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/webinarResponse' }
   *       400:
   *         description: Invalid request or webinar at capacity
   *       404:
   *         description: Webinar not found
   *       500:
   *         description: Server error
   */
   api.post("/:id/participants", async (req, res) => {
       try {
           const { id } = req.params;
           const { userIds } = req.body;
           
           if (!userIds || (Array.isArray(userIds) && userIds.length === 0)) {
             return res.status(400).json({ ok: false, message: "At least one user ID is required" });
           }
            
           const { ok, data, message } = await webinarController.addParticipantsWebinar(id, userIds);
           if (ok) {
               res.status(200).json({ ok, data, message });
           } else {
               let statusCode = 400;
               if (message === "Webinar not found") statusCode = 404;
               res.status(statusCode).json({ ok, message });
           }
       } catch (error) {
           res.status(500).json({ ok: false, message: error.message });
       }
   });

  /**
   * @swagger
   * /api/v1/webinars/{id}/participants:
   *   delete:
   *     summary: Remove participants from a webinar
   *     description: Unregister one or more users from a webinar
   *     tags: [Webinars]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *         description: The ID of the webinar
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               userIds:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Array of user IDs to unregister from the webinar
   *     responses:
   *       200:
   *         description: Successfully unregistered users from the webinar
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/webinarResponse' }
   *       400:
   *         description: Invalid request
   *       404:
   *         description: Webinar not found
   *       500:
   *         description: Server error
   */
   api.delete("/:id/participants", async (req, res) => {
       try {
           const { id } = req.params;
           const { userIds } = req.body;
           
           if (!userIds || (Array.isArray(userIds) && userIds.length === 0)) {
             return res.status(400).json({ ok: false, message: "At least one user ID is required" });
           }
            
           const { ok, data, message } = await webinarController.unregisterUsersFromWebinar(id, userIds);
           if (ok) {
               res.status(200).json({ ok, data, message });
           } else {
               let statusCode = 400;
               if (message === "Webinar not found") statusCode = 404;
               res.status(statusCode).json({ ok, message });
           }
       } catch (error) {
           res.status(500).json({ ok: false, message: error.message });
       }
   });

  /**
   * @swagger
   * /api/v1/webinars/{id}/join:
   *   get:
   *     summary: Join a webinar
   *     description: Generate a token and meeting details to join a webinar
   *     tags: [Webinars]
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
   *         description: Successfully joined webinar
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
   *                     jitsiUrl:
   *                       type: string
   *                       description: Jitsi server URL
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
  api.get("/:id/join", async (req, res) => {
    try {
      const { id } = req.params;
      const bufferMinutes = parseInt(req.query.bufferMinutes) || 30;
      
      const userId = req.user.id;
      
      if (!userId) {
        return res.status(401).json({ 
          ok: false, 
          message: "Authentication required" 
        });
      }
      
      const { ok, data, message } = await webinarController.joinWebinar(id, userId, bufferMinutes);
      
      if (ok) {
        res.status(200).json({ ok, data, message });
      } else {
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

  // Backward compatibility routes
  
  /**
   * @swagger
   * /api/v1/webinars/{id}/register:
   *   post:
   *     summary: Register current user for a webinar
   *     description: Add the authenticated user to the webinar's participants
   *     tags: [Webinars]
   *     deprecated: true
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *         description: The ID of the webinar
   *     responses:
   *       200:
   *         description: Successfully registered for the webinar
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/webinarResponse' }
   *       400:
   *         description: Already registered or other issue
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Webinar not found
   *       500:
   *         description: Server error
   */
   api.post("/:id/register", async (req, res) => {
       try {
           const { id } = req.params;
           const userId = req.user.id;
           
           if (!userId) {
             return res.status(401).json({ ok: false, message: "Authentication required" });
           }
            
           const { ok, data, message } = await webinarController.addParticipantsWebinar(id, userId);
           if (ok) {
               res.status(200).json({ ok, data, message });
           } else {
               let statusCode = 400;
               if (message === "Webinar not found") statusCode = 404;
               res.status(statusCode).json({ ok, message });
           }
       } catch (error) {
           res.status(500).json({ ok: false, message: error.message });
       }
   });

  /**
   * @swagger
   * /api/v1/webinars/{id}/unregister:
   *   delete:
   *     summary: Unregister current user from a webinar
   *     description: Remove the authenticated user from the webinar's participants
   *     tags: [Webinars]
   *     deprecated: true
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *         description: The ID of the webinar
   *     responses:
   *       200:
   *         description: Successfully unregistered from the webinar
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/webinarResponse' }
   *       400:
   *         description: Not registered or other issue
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Webinar not found
   *       500:
   *         description: Server error
   */
   api.delete("/:id/unregister", async (req, res) => {
       try {
           const { id } = req.params;
           const userId = req.user.id;
           
           if (!userId) {
             return res.status(401).json({ ok: false, message: "Authentication required" });
           }
            
           const { ok, data, message } = await webinarController.unregisterUsersFromWebinar(id, userId);
           if (ok) {
               res.status(200).json({ ok, data, message });
           } else {
               let statusCode = 400;
               if (message === "Webinar not found") statusCode = 404;
               res.status(statusCode).json({ ok, message });
           }
       } catch (error) {
           res.status(500).json({ ok: false, message: error.message });
       }
   });

  return api;
};