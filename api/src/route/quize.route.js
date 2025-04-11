const express = require('express');
const QuizeController = require("../controller/quize.controller");

// Swagger Definitions for Quiz - Adapt based on quize.model.js
/**
 * @swagger
 * components:
 *   schemas:
 *     Question:
 *       type: object
 *       required: [text, options, correctAnswer]
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated ID for the question (if subdocument)
 *         text:
 *           type: string
 *           description: The text of the question
 *         options:
 *           type: array
 *           items:
 *             type: string
 *           description: List of possible answers/options
 *         correctAnswer:
 *           type: string # Or number, depending on how options are referenced
 *           description: The correct answer from the options list
 *         explanation:
 *           type: string
 *           description: Optional explanation for the correct answer
 *     Quize:
 *       type: object
 *       required:
 *         - title
 *         - cluster
 *         - webinar
 *         - questions
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated unique identifier
 *         title:
 *           type: string
 *           description: Title of the quiz
 *         description:
 *           type: string
 *           description: Optional description of the quiz
 *         cluster:
 *           type: string 
 *           description: ID of the related cluster
 *         webinar:
 *           type: string
 *           description: ID of the related webinar
 *         questions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Question'
 *           description: List of questions in the quiz
 *         duration:
 *           type: number
 *           description: Optional duration limit for the quiz in minutes
 *         passMark:
 *           type: number
 *           description: Optional passing score percentage
 *         published:
 *           type: boolean
 *           default: false
 *           description: Whether the quiz is available for attempts
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     QuizeResponse:
 *       type: object
 *       properties:
 *         ok:
 *           type: boolean
 *           description: Operation success status
 *         data:
 *           oneOf:
 *             - $ref: '#/components/schemas/Quize'
 *             - type: array
 *               items:
 *                 $ref: '#/components/schemas/Quize'
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
   * /api/v1/quizes:
   *   post:
   *     summary: Create a new quiz
   *     description: Create a new quiz with title, questions, and associated cluster/webinar
   *     tags: [Quizes]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Quize'
   *     responses:
   *       201:
   *         description: Quiz created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/QuizeResponse'
   *       400:
   *         description: Invalid input data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/QuizeResponse'
   */
  api.post("/", async (req, res) => {
    try {
      const body = req.body;
      const { ok, data, message } = await QuizeController.createQuize(body);
      if (!ok) throw new Error(message);
      res.status(201).json({ ok, data, message });
    } catch (error) {
      res.status(400).json({ ok: false, message: error.message });
    }
  });

  /**
   * @swagger
   * /api/v1/quizes:
   *   get:
   *     summary: Get all quizzes
   *     description: Retrieve a list of quizzes with filters and pagination
   *     tags: [Quizes]
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
   *         name: cluster
   *         schema:
   *           type: string
   *         description: Filter by cluster ID
   *       - in: query
   *         name: webinar
   *         schema:
   *           type: string
   *         description: Filter by webinar ID
   *       - in: query
   *         name: published
   *         schema:
   *           type: boolean
   *         description: Filter by published status
   *       - in: query
   *         name: select
   *         schema:
   *           type: string
   *           example: title description cluster webinar published
   *         description: Select specific fields to return (space-separated)
   *       - in: query
   *         name: populate
   *         schema:
   *           type: string
   *           example: cluster webinar
   *         description: Populate related fields (space-separated)
   *     responses:
   *       200:
   *         description: Successfully retrieved quizzes
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/QuizeResponse'
   *       500:
   *         description: Server error
   */
  api.get("/", async (req, res) => {
    try {
      const { page, limit, sort, select, populate, ...filter } = req.query;
      const options = { page, limit, sort, select, populate };
      if (options.sort) {
          const parts = options.sort.split(':');
          options.sort = { [parts[0]]: parseInt(parts[1]) };
      } else {
           options.sort = { createdAt: -1 };
      }
       // Convert boolean string to actual boolean if present
      if (filter.published !== undefined) {
           filter.published = filter.published === 'true' || filter.published === '1';
      }
      const { ok, data, pagination, message } = await QuizeController.getQuizes(filter, options);
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
   * /api/v1/quizes/{id}:
   *   get:
   *     summary: Get quiz by ID
   *     description: Retrieve a specific quiz, optionally populating related fields
   *     tags: [Quizes]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Quiz ID
   *       - in: query
   *         name: populate
   *         schema:
   *           type: string
   *           example: cluster webinar
   *         description: Populate related fields (space-separated)
   *     responses:
   *       200:
   *         description: Quiz retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/QuizeResponse'
   *       404:
   *         description: Quiz not found
   *       500:
   *         description: Server error
   */
  api.get("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { populate } = req.query;
      const options = { populate };
      const { ok, data, message } = await QuizeController.getQuizeById(id, options);
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
   * /api/v1/quizes/{id}:
   *   put:
   *     summary: Update a quiz
   *     description: Update details of an existing quiz (title, description, questions, etc.)
   *     tags: [Quizes]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Quiz ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Quize' // Allow full update, but handle immutables
   *     responses:
   *       200:
   *         description: Quiz updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/QuizeResponse'
   *       404:
   *         description: Quiz not found
   *       400:
   *         description: Invalid update data (validation error)
   *       500:
   *         description: Server error
   */
  api.put("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const body = req.body;
      // Prevent updating immutable fields like _id, createdAt
      delete body._id;
      delete body.createdAt;
      delete body.updatedAt;

      const { ok, data, message } = await QuizeController.updateQuize(id, body);
      if (ok) {
          if (data) {
              res.status(200).json({ ok, message, data });
          } else {
              res.status(404).json({ ok: false, message: message || "Quiz not found" });
          }
      } else {
        // Distinguish between validation error (400) and other errors (500)
        res.status(message.includes('validation failed') ? 400 : 500).json({ ok, message });
      }
    } catch (error) {
      res.status(500).json({ ok: false, message: error.message });
    }
  });

  /**
   * @swagger
   * /api/v1/quizes/{id}:
   *   delete:
   *     summary: Delete a quiz
   *     description: Remove a quiz and potentially its associated data (use with caution)
   *     tags: [Quizes]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Quiz ID
   *     responses:
   *       200:
   *         description: Quiz deleted successfully
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
   *         description: Quiz not found
   *       500:
   *         description: Server error
   */
  api.delete("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { ok, data, message } = await QuizeController.deleteQuize(id);
      if (ok) {
          if(data) {
            res.status(200).json({ ok, message }); // Or 204 No Content
          } else {
            res.status(404).json({ ok: false, message: message || "Quiz not found" });
          }
      } else {
        res.status(500).json({ ok, message });
      }
    } catch (error) {
      res.status(500).json({ ok: false, message: error.message });
    }
  });

  // --- Question Management Routes ---

  /**
   * @swagger
   * /api/v1/quizes/{id}/questions:
   *   post:
   *     summary: Add a question to a quiz
   *     description: Add a new question object to the quiz's questions array
   *     tags: [Quizes]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the quiz to add the question to
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Question'
   *     responses:
   *       200:
   *         description: Question added successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/QuizeResponse' # Returns updated quiz
   *       400:
   *         description: Invalid question data
   *       404:
   *         description: Quiz not found
   *       500:
   *         description: Server error
   */
   api.post("/:id/questions", async (req, res) => {
       try {
           const { id } = req.params;
           const questionData = req.body;
           const { ok, data, message } = await QuizeController.addQuestionToQuize(id, questionData);
           if (ok) {
               res.status(200).json({ ok, data, message });
           } else {
               res.status(message === "Quiz not found" ? 404 : 400).json({ ok, message });
           }
       } catch (error) {
           res.status(500).json({ ok: false, message: error.message });
       }
   });

  /**
   * @swagger
   * /api/v1/quizes/{quizId}/questions/{questionId}:
   *   delete:
   *     summary: Remove a question from a quiz
   *     description: Remove a specific question from the quiz's questions array by its ID
   *     tags: [Quizes]
   *     parameters:
   *       - in: path
   *         name: quizId
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the quiz
   *       - in: path
   *         name: questionId
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the question to remove (assuming subdocument _id)
   *     responses:
   *       200:
   *         description: Question removed successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/QuizeResponse' # Returns updated quiz
   *       404:
   *         description: Quiz or Question not found
   *       500:
   *         description: Server error
   */
   api.delete("/:quizId/questions/:questionId", async (req, res) => {
       try {
           const { quizId, questionId } = req.params;
           const { ok, data, message } = await QuizeController.removeQuestionFromQuize(quizId, questionId);
            if (ok) {
               // Check if the update actually removed something (might depend on controller logic)
               // Here, we assume success if controller returns ok:true and data exists
               if (data) {
                   res.status(200).json({ ok, data, message });
               } else {
                   // This case might indicate the quiz was found but the question wasn't,
                   // or the quiz itself wasn't found. Controller should clarify.
                   res.status(404).json({ ok: false, message: message || "Quiz or Question not found" });
               }
           } else {
                // If controller returns ok:false, assume quiz not found or other error
               res.status(message === "Quiz not found" ? 404 : 500).json({ ok, message });
           }
       } catch (error) {
           res.status(500).json({ ok: false, message: error.message });
       }
   });

  // TODO: Add routes for updating a specific question if needed
  // PUT /api/v1/quizes/{quizId}/questions/{questionId}

  return api;
}; 