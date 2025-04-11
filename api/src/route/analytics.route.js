const express = require('express');
const AnalyticsController = require("../controller/analytics.controller");

// Basic Swagger definitions - Adapt these based on the actual AnalyticsModel schema
/**
 * @swagger
 * components:
 *   schemas:
 *     AnalyticsRecord: // Renamed from Enumerator
 *       type: object
 *       required:
 *         // Add required fields from analytics.model.js here
 *         - eventType
 *         - userId // Example: Assuming analytics is tied to a user
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated unique identifier
 *         eventType:
 *           type: string
 *           description: Type of event being tracked
 *         userId:
 *           type: string
 *           description: ID of the user associated with the event (if applicable)
 *         eventData:
 *           type: object
 *           description: Additional data associated with the event
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of record creation
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of last update
 *     AnalyticsResponse: // Renamed from EnumeratorResponse
 *       type: object
 *       properties:
 *         ok:
 *           type: boolean
 *           description: Operation success status
 *         data:
 *           oneOf:
 *             - $ref: '#/components/schemas/AnalyticsRecord'
 *             - type: array
 *               items:
 *                 $ref: '#/components/schemas/AnalyticsRecord'
 *             - type: null
 *         message:
 *           type: string
 *           description: Response message
 *         pagination: // Added for list responses
 *           type: object
 *           properties:
 *              total:
 *                  type: integer
 *              totalPages:
 *                  type: integer
 *              currentPage:
 *                  type: integer
 *              limit:
 *                  type: integer
 *              hasNext:
 *                  type: boolean
 *              hasPrev:
 *                  type: boolean
 */

module.exports = () => {
  const api = express.Router();

  /**
   * @swagger
   * /api/v1/analytics: // Updated path
   *   post:
   *     summary: Create a new analytics record
   *     description: Create a new analytics record with the provided data
   *     tags: [Analytics] // Updated tag
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/AnalyticsRecord' // Reference the correct schema
   *     responses:
   *       201:
   *         description: Analytics record created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AnalyticsResponse'
   *       400:
   *         description: Invalid input data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AnalyticsResponse'
   */
  api.post("/", async (req, res) => {
    try {
      const body = req.body;
      const { ok, data, message } = await AnalyticsController.createAnalytics(body);
      if (!ok) throw new Error(message);
      res.status(201).json({ ok, data, message });
    } catch (error) {
      res.status(400).json({ ok: false, message: error.message });
    }
  });

  /**
   * @swagger
   * /api/v1/analytics: // Updated path
   *   get:
   *     summary: Get all analytics records
   *     description: Retrieve a list of all analytics records with optional filters and pagination
   *     tags: [Analytics] // Updated tag
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
   *         description: Sort order (e.g., field:1 for ascending, field:-1 for descending)
   *       // Add other relevant filter parameters based on AnalyticsModel schema
   *       - in: query
   *         name: eventType
   *         schema:
   *           type: string
   *         description: Filter by event type
   *     responses:
   *       200:
   *         description: Successfully retrieved analytics records
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AnalyticsResponse'
   *       500:
   *         description: Server error
   */
  api.get("/", async (req, res) => {
    try {
        // Extract filter and options from query parameters
        const { page, limit, sort, ...filter } = req.query;
        const options = { page, limit, sort }; 
        
        // Parse sort parameter if provided (example: "createdAt:-1")
        if (options.sort) {
            const parts = options.sort.split(':');
            options.sort = { [parts[0]]: parseInt(parts[1]) };
        } else {
             options.sort = { createdAt: -1 }; // Default sort
        }

      const { ok, data, pagination, message } = await AnalyticsController.getAnalytics(filter, options);
      if (ok) {
        res.status(200).json({ ok, message, data, pagination });
      } else {
        res.status(500).json({ ok, message }); // Use appropriate status code for errors
      }
    } catch (error) {
      res.status(500).json({ ok: false, message: error.message });
    }
  });

  /**
   * @swagger
   * /api/v1/analytics/{id}: // Updated path
   *   get:
   *     summary: Get a specific analytics record by ID
   *     description: Retrieve details of a single analytics record
   *     tags: [Analytics] // Updated tag
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The analytics record ID
   *     responses:
   *       200:
   *         description: Successfully retrieved analytics record
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AnalyticsResponse'
   *       404:
   *         description: Analytics record not found
   *       500:
   *         description: Server error
   */
  api.get("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { ok, data, message } = await AnalyticsController.getAnalyticsById(id);
      if (ok) {
        res.status(200).json({ ok, message, data });
      } else {
        // If data is null and message indicates not found, return 404
        res.status(data ? 500 : 404).json({ ok, message }); 
      }
    } catch (error) {
      res.status(500).json({ ok: false, message: error.message });
    }
  });

  /**
   * @swagger
   * /api/v1/analytics/{id}: // Updated path
   *   put:
   *     summary: Update an analytics record
   *     description: Update an existing analytics record's information
   *     tags: [Analytics] // Updated tag
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The analytics record ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/AnalyticsRecord' // Or a specific update schema
   *     responses:
   *       200:
   *         description: Analytics record updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AnalyticsResponse'
   *       404:
   *         description: Analytics record not found
   *       400:
   *         description: Invalid update data
   *       500:
   *         description: Server error
   */
  api.put("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const body = req.body;
      // Ensure immutable fields like _id or createdAt are not in the body if necessary
      delete body._id;
      delete body.createdAt;
      delete body.updatedAt;

      const { ok, data, message } = await AnalyticsController.updateAnalytics(id, body);
      if (ok) {
          if (data) {
              res.status(200).json({ ok, message, data });
          } else {
              // If update was technically successful but didn't find the doc
              res.status(404).json({ ok: false, message: message || "Analytics record not found" });
          }
      } else {
        res.status(400).json({ ok, message }); // Or 500 depending on controller logic
      }
    } catch (error) {
      res.status(500).json({ ok: false, message: error.message });
    }
  });

  /**
   * @swagger
   * /api/v1/analytics/{id}: // Updated path
   *   delete:
   *     summary: Delete an analytics record
   *     description: Remove an analytics record by its ID
   *     tags: [Analytics] // Updated tag
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The analytics record ID
   *     responses:
   *       200:
   *         description: Analytics record deleted successfully
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
   *         description: Analytics record not found
   *       500:
   *         description: Server error
   */
  api.delete("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { ok, data, message } = await AnalyticsController.deleteAnalytics(id);
      if (ok) {
          if(data) {
            res.status(200).json({ ok, message }); // Or 204 No Content
          } else {
            res.status(404).json({ ok: false, message: message || "Analytics record not found" });
          } 
      } else {
        res.status(500).json({ ok, message }); // Or appropriate error code
      }
    } catch (error) {
      res.status(500).json({ ok: false, message: error.message });
    }
  });

  return api;
}; 