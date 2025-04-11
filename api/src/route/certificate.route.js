const express = require('express');
const CertificateController = require("../controller/certificate.controller");

// Basic Swagger definitions - Adapt based on certificate.model.js
/**
 * @swagger
 * components:
 *   schemas:
 *     Certificate:
 *       type: object
 *       required:
 *         // Add required fields from certificate.model.js
 *         - userId
 *         - courseId
 *         - issueDate
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated unique identifier
 *         userId:
 *           type: string
 *           description: ID of the user receiving the certificate
 *         courseId:
 *           type: string
 *           description: ID of the course completed
 *         issueDate:
 *           type: string
 *           format: date-time
 *           description: Date the certificate was issued
 *         certificateUrl:
 *           type: string
 *           description: URL to the certificate file/image
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of record creation
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of last update
 *     CertificateResponse:
 *       type: object
 *       properties:
 *         ok:
 *           type: boolean
 *           description: Operation success status
 *         data:
 *           oneOf:
 *             - $ref: '#/components/schemas/Certificate'
 *             - type: array
 *               items:
 *                 $ref: '#/components/schemas/Certificate'
 *             - type: null
 *         message:
 *           type: string
 *           description: Response message
 *         pagination:
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
   * /api/v1/certificates:
   *   post:
   *     summary: Create a new certificate record
   *     description: Issue a new certificate
   *     tags: [Certificates]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Certificate'
   *     responses:
   *       201:
   *         description: Certificate created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/CertificateResponse'
   *       400:
   *         description: Invalid input data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/CertificateResponse'
   */
  api.post("/", async (req, res) => {
    try {
      const body = req.body;
      const { ok, data, message } = await CertificateController.createCertificate(body);
      if (!ok) throw new Error(message);
      res.status(201).json({ ok, data, message });
    } catch (error) {
      res.status(400).json({ ok: false, message: error.message });
    }
  });

  /**
   * @swagger
   * /api/v1/certificates:
   *   get:
   *     summary: Get all certificates
   *     description: Retrieve a list of certificates with filters and pagination
   *     tags: [Certificates]
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
   *           example: issueDate:-1
   *       - in: query
   *         name: userId
   *         schema:
   *           type: string
   *         description: Filter by user ID
   *       - in: query
   *         name: courseId
   *         schema:
   *           type: string
   *         description: Filter by course ID
   *     responses:
   *       200:
   *         description: Successfully retrieved certificates
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/CertificateResponse'
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
      const { ok, data, pagination, message } = await CertificateController.getCertificates(filter, options);
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
   * /api/v1/certificates/{id}:
   *   get:
   *     summary: Get certificate by ID
   *     description: Retrieve a specific certificate
   *     tags: [Certificates]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Certificate ID
   *     responses:
   *       200:
   *         description: Certificate retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/CertificateResponse'
   *       404:
   *         description: Certificate not found
   *       500:
   *         description: Server error
   */
  api.get("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { ok, data, message } = await CertificateController.getCertificateById(id);
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
   * /api/v1/certificates/{id}:
   *   put:
   *     summary: Update a certificate
   *     description: Update an existing certificate record
   *     tags: [Certificates]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Certificate ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Certificate' // Or a specific update schema
   *     responses:
   *       200:
   *         description: Certificate updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/CertificateResponse'
   *       404:
   *         description: Certificate not found
   *       400:
   *         description: Invalid update data
   *       500:
   *         description: Server error
   */
  api.put("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const body = req.body;
      delete body._id;
      delete body.createdAt;
      delete body.updatedAt;

      const { ok, data, message } = await CertificateController.updateCertificate(id, body);
      if (ok) {
          if (data) {
              res.status(200).json({ ok, message, data });
          } else {
              res.status(404).json({ ok: false, message: message || "Certificate not found" });
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
   * /api/v1/certificates/{id}:
   *   delete:
   *     summary: Delete a certificate
   *     description: Remove a certificate record
   *     tags: [Certificates]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Certificate ID
   *     responses:
   *       200:
   *         description: Certificate deleted successfully
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
   *         description: Certificate not found
   *       500:
   *         description: Server error
   */
  api.delete("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { ok, data, message } = await CertificateController.deleteCertificate(id);
      if (ok) {
          if(data) {
            res.status(200).json({ ok, message });
          } else {
            res.status(404).json({ ok: false, message: message || "Certificate not found" });
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