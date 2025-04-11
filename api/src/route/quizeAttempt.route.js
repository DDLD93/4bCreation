const express = require('express');
const QuizeAttemptController = require("../controller/quizeAttempt.controller");

// Basic Swagger definitions - Adapt based on quizeAttempt.model.js
/**
 * @swagger
 * components:
 *   schemas:
 *     QuizeAttempt:
 *       type: object
 *       required:
 *         - user
 *         - quiz
 *         - answers
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated unique identifier
 *         user:
 *           type: string
 *           description: ID of the user who took the quiz
 *         quiz:
 *           type: string
 *           description: ID of the quiz attempted
 *         answers:
 *           type: array
 *           items:
 *             type: object // Define structure based on how answers are stored
 *             properties:
 *               questionId:
 *                  type: string
 *               selectedOption:
 *                  type: string # or number, depending on option format
 *           description: User's answers for each question
 *         score:
 *           type: number
 *           description: Score obtained by the user
 *         startedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the attempt started
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the attempt was completed/submitted
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of record creation
 *     QuizeAttemptResponse:
 *       type: object
 *       properties:
 *         ok:
 *           type: boolean
 *           description: Operation success status
 *         data:
 *           oneOf:
 *             - $ref: '#/components/schemas/QuizeAttempt'
 *             - type: array
 *               items:
 *                 $ref: '#/components/schemas/QuizeAttempt'
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
   * /api/v1/quize-attempts:
   *   post:
   *     summary: Record a new quiz attempt
   *     description: Submit answers for a quiz attempt
   *     tags: [QuizeAttempts]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/QuizeAttempt'
   *     responses:
   *       201:
   *         description: Quiz attempt recorded successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/QuizeAttemptResponse'
   *       400:
   *         description: Invalid input data or attempt rules violation
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/QuizeAttemptResponse'
   */
  api.post("/", async (req, res) => {
    try {
      const body = req.body;
      // TODO: Add logic here or in controller to calculate score before saving
      const { ok, data, message } = await QuizeAttemptController.createQuizeAttempt(body);
      if (!ok) throw new Error(message);
      res.status(201).json({ ok, data, message });
    } catch (error) {
      res.status(400).json({ ok: false, message: error.message });
    }
  });

  /**
   * @swagger
   * /api/v1/quize-attempts:
   *   get:
   *     summary: Get all quiz attempts
   *     description: Retrieve a list of quiz attempts with filters and pagination
   *     tags: [QuizeAttempts]
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
   *           example: completedAt:-1
   *       - in: query
   *         name: user
   *         schema:
   *           type: string
   *         description: Filter by user ID
   *       - in: query
   *         name: quiz
   *         schema:
   *           type: string
   *         description: Filter by quiz ID
   *     responses:
   *       200:
   *         description: Successfully retrieved quiz attempts
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/QuizeAttemptResponse'
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
      const { ok, data, pagination, message } = await QuizeAttemptController.getQuizeAttempts(filter, options);
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
   * /api/v1/quize-attempts/{id}:
   *   get:
   *     summary: Get quiz attempt by ID
   *     description: Retrieve details of a specific quiz attempt
   *     tags: [QuizeAttempts]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Quiz Attempt ID
   *     responses:
   *       200:
   *         description: Quiz attempt retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/QuizeAttemptResponse'
   *       404:
   *         description: Quiz attempt not found
   *       500:
   *         description: Server error
   */
  api.get("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { ok, data, message } = await QuizeAttemptController.getQuizeAttemptById(id);
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
   * /api/v1/quize-attempts/{id}:
   *   put:
   *     summary: Update a quiz attempt
   *     description: Update specific details of a quiz attempt (e.g., score after manual grading)
   *     tags: [QuizeAttempts]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Quiz Attempt ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties: // Only include fields that should be updatable
   *                score:
   *                   type: number
   *                status: // Example: if you have a status field
   *                   type: string
   *     responses:
   *       200:
   *         description: Quiz attempt updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/QuizeAttemptResponse'
   *       404:
   *         description: Quiz attempt not found
   *       400:
   *         description: Invalid update data
   *       500:
   *         description: Server error
   */
  api.put("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const body = req.body;
      // Ensure only allowed fields are updated
      const allowedUpdates = { score: body.score, status: body.status }; // Example
      // Remove undefined fields
       Object.keys(allowedUpdates).forEach(key => allowedUpdates[key] === undefined && delete allowedUpdates[key]);

      if (Object.keys(allowedUpdates).length === 0) {
          return res.status(400).json({ ok: false, message: "No valid fields provided for update."}) 
      }

      const { ok, data, message } = await QuizeAttemptController.updateQuizeAttempt(id, allowedUpdates);
      if (ok) {
          if (data) {
              res.status(200).json({ ok, message, data });
          } else {
              res.status(404).json({ ok: false, message: message || "Quiz attempt not found" });
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
   * /api/v1/quize-attempts/{id}:
   *   delete:
   *     summary: Delete a quiz attempt
   *     description: Remove a quiz attempt record (use with caution)
   *     tags: [QuizeAttempts]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Quiz Attempt ID
   *     responses:
   *       200:
   *         description: Quiz attempt deleted successfully
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
   *         description: Quiz attempt not found
   *       500:
   *         description: Server error
   */
  api.delete("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { ok, data, message } = await QuizeAttemptController.deleteQuizeAttempt(id);
      if (ok) {
          if(data) {
            res.status(200).json({ ok, message }); // Or 204
          } else {
            res.status(404).json({ ok: false, message: message || "Quiz attempt not found" });
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