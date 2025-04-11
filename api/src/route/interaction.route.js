const express = require('express');
const InteractionController = require("../controller/interaction.controller");

// Basic Swagger definitions - Adapt based on interaction.model.js
/**
 * @swagger
 * components:
 *   schemas:
 *     Interaction:
 *       type: object
 *       required:
 *         // Add required fields from interaction.model.js
 *         - user
 *         - type
 *         - referenceId // Assuming this links to quiz, webinar, etc.
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated unique identifier
 *         user:
 *           type: string
 *           description: ID of the user involved in the interaction
 *         type:
 *           type: string
 *           enum: ['quiz_attempt', 'webinar_join', 'comment', 'like'] // Example types
 *           description: Type of interaction
 *         referenceId:
 *           type: string
 *           description: ID of the related entity (Quiz, Webinar, Post, etc.)
 *         details:
 *           type: object
 *           description: Additional details about the interaction
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of interaction
 *     InteractionResponse:
 *       type: object
 *       properties:
 *         ok:
 *           type: boolean
 *           description: Operation success status
 *         data:
 *           oneOf:
 *             - $ref: '#/components/schemas/Interaction'
 *             - type: array
 *               items:
 *                 $ref: '#/components/schemas/Interaction'
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
   * /api/v1/interactions:
   *   post:
   *     summary: Create a new interaction record
   *     description: Log a new user interaction
   *     tags: [Interactions]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Interaction'
   *     responses:
   *       201:
   *         description: Interaction created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/InteractionResponse'
   *       400:
   *         description: Invalid input data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/InteractionResponse'
   */
  api.post("/", async (req, res) => {
    try {
      const body = req.body;
      const { ok, data, message } = await InteractionController.createInteraction(body);
      if (!ok) throw new Error(message);
      res.status(201).json({ ok, data, message });
    } catch (error) {
      res.status(400).json({ ok: false, message: error.message });
    }
  });

  /**
   * @swagger
   * /api/v1/interactions:
   *   get:
   *     summary: Get all interactions
   *     description: Retrieve a list of interactions with filters and pagination
   *     tags: [Interactions]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *       - in: query
   *         name: sort
   *         schema:
   *           type: string
   *           example: createdAt:-1
   *       - in: query
   *         name: user
   *         schema:
   *           type: string
   *         description: Filter by user ID
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *         description: Filter by interaction type
   *       - in: query
   *         name: referenceId
   *         schema:
   *           type: string
   *         description: Filter by reference ID
   *     responses:
   *       200:
   *         description: Successfully retrieved interactions
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/InteractionResponse'
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
      const { ok, data, pagination, message } = await InteractionController.getInteractions(filter, options);
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
   * /api/v1/interactions/{id}:
   *   get:
   *     summary: Get interaction by ID
   *     description: Retrieve a specific interaction record
   *     tags: [Interactions]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Interaction ID
   *     responses:
   *       200:
   *         description: Interaction retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/InteractionResponse'
   *       404:
   *         description: Interaction not found
   *       500:
   *         description: Server error
   */
  api.get("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { ok, data, message } = await InteractionController.getInteractionById(id);
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
   * /api/v1/interactions/{id}:
   *   put:
   *     summary: Update an interaction
   *     description: Update an existing interaction record (use case might be limited)
   *     tags: [Interactions]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Interaction ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Interaction' // Or a specific update schema
   *     responses:
   *       200:
   *         description: Interaction updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/InteractionResponse'
   *       404:
   *         description: Interaction not found
   *       400:
   *         description: Invalid update data
   *       500:
   *         description: Server error
   */
  api.put("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const body = req.body;
      // Generally, interactions might be immutable, but allowing update for flexibility
      delete body._id;
      delete body.createdAt; // Keep createdAt usually
      delete body.user; // Usually cannot change user

      const { ok, data, message } = await InteractionController.updateInteraction(id, body);
      if (ok) {
          if (data) {
              res.status(200).json({ ok, message, data });
          } else {
              res.status(404).json({ ok: false, message: message || "Interaction not found" });
          }
      } else {
        res.status(400).json({ ok, message });
      }
    } catch (error) {
      res.status(500).json({ ok: false, message: error.message });
    }
  });

  /**
   * @swagger
   * /api/v1/interactions/{id}:
   *   delete:
   *     summary: Delete an interaction
   *     description: Remove an interaction record (use with caution)
   *     tags: [Interactions]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Interaction ID
   *     responses:
   *       200:
   *         description: Interaction deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 ok:
   *                   type: boolean
   *                 message:
   *                   type: string
   *       404:
   *         description: Interaction not found
   *       500:
   *         description: Server error
   */
  api.delete("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { ok, data, message } = await InteractionController.deleteInteraction(id);
      if (ok) {
          if(data) {
            res.status(200).json({ ok, message }); // Or 204 No Content
          } else {
            res.status(404).json({ ok: false, message: message || "Interaction not found" });
          }
      } else {
        res.status(500).json({ ok, message });
      }
    } catch (error) {
      res.status(500).json({ ok: false, message: error.message });
    }
  });

  return api;
}; 