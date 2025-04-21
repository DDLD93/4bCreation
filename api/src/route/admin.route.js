const express = require("express");
const AdminController = require("../controller/admin.controller");

// const { base64toURL, rollbackUpload } = require("../middleware/upload.middleware");

/**
 * @swagger
 * tags:
 *   name: Adminentication
 *   description: admin Adminentication and management endpoints
 */

module.exports = () => {
  const api = new express.Router();

  /**
   * @swagger
   * /admin/register:
   *   post:
   *     summary: Register a new admin
   *     description: Create a new admin account. The admin will receive a welcome email with activation instructions.
   *     tags: [Adminentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/adminInput'
   *     responses:
   *       201:
   *         description: admin registered successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 ok:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: Registration successful
   *                 data:
   *                   $ref: '#/components/schemas/adminResponse'
   *       400:
   *         description: Invalid input data or email already exists
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  api.post("/register", async (req, res) => {
    try {
      const body = req.body;
      const { ok, data, message } = await AdminController.register(body);
      if (!ok) throw new Error(message);
      res.status(201).json({ ok, data, message });
    } catch (error) {
      res.status(400).json({ ok: false, message: error.message });
    }
  });

  /**
   * @swagger
   * /admin/login:
   *   post:
   *     summary: admin login
   *     description: Adminenticate a admin and return a JWT token
   *     tags: [Adminentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginInput'
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LoginResponse'
   *       400:
   *         description: Invalid credentials
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  api.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const { ok, data, message } = await AdminController.login(email, password);
      if (ok) {
        res.status(200).json({ ok, data });
      } else {
        res.status(400).json({ ok, message });
      }
    } catch (error) {
      res.status(500).json({ ok: false, message: error.message });
    }
  });

  /**
   * @swagger
   * /admin/verify-email:
   *   post:
   *     summary: Verify email address
   *     description: Send a verification email to the admin
   *     tags: [Adminentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/EmailInput'
   *     responses:
   *       200:
   *         description: Verification email sent
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 ok:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *       400:
   *         description: Invalid email or admin not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  api.post("/verify-email", async (req, res) => {
    try {
      const { email } = req.body;
      const { ok, message } = await AdminController.verifyEmail(email);
      if (ok) {
        res.status(200).json({ ok, message });
      } else {
        res.status(400).json({ ok, message });
      }
    } catch (error) {
      res.status(500).json({ ok: false, message: error.message });
    }
  });

  /**
   * @swagger
   * /admin/refresh-token:
   *   post:
   *     summary: Refresh access token
   *     description: Get a new access token using a refresh token
   *     tags: [Adminentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RefreshTokenInput'
   *     responses:
   *       200:
   *         description: New access token generated
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 ok:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     token:
   *                       type: string
   *       400:
   *         description: Invalid refresh token
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  api.post("/refresh-token", async (req, res) => {
    const { refreshToken, email } = req.body;
    try {
      const { ok, data, message } = await AdminController.getAccessToken(email, refreshToken);
      if (ok) {
        res.status(200).json({ ok, data });
      } else {
        res.status(400).json({ ok, message });
      }
    } catch (error) {
      res.status(500).json({ ok: false, message: error.message });
    }
  });

  /**
   * @swagger
   * /admin/recover-account:
   *   post:
   *     summary: Recover account
   *     description: Initiate account recovery process
   *     tags: [Adminentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/EmailInput'
   *     responses:
   *       200:
   *         description: Recovery instructions sent
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 ok:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *       400:
   *         description: Invalid email or account not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  api.post("/recover-account", async (req, res) => {
    try {
      const { email } = req.body;
      const { ok, message } = await AdminController.recoverAccount(email);
      if (ok) {
        res.status(200).json({ ok, message });
      } else {
        res.status(400).json({ ok, message });
      }
    } catch (error) {
      res.status(500).json({ ok: false, message: error.message });
    }
  });

  /**
   * @swagger
   * /admin/validate-code:
   *   post:
   *     summary: Validate OTP code
   *     description: Validate a one-time password sent to admin's email
   *     tags: [Adminentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/OtpInput'
   *     responses:
   *       200:
   *         description: Code validated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 ok:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                 data:
   *                   type: object
   *       500:
   *         description: Invalid code or server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  api.post("/validate-code", async (req, res) => {
    try {
      const { email, otp } = req.body;
      const { ok, data, message } = await AdminController.validateCode(otp, email);
      if (ok) {
        res.status(200).json({ ok, data, message });
      } else {
        res.status(500).json({ ok, message });
      }
    } catch (error) {
      res.status(500).json({ ok: false, message: error.message });
    }
  });

  /**
   * @swagger
   * /admin/activate-account:
   *   post:
   *     summary: Activate account
   *     description: Activate a admin account with a token and set initial password
   *     tags: [Adminentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TokenInput'
   *     responses:
   *       200:
   *         description: Account activated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 ok:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/adminResponse'
   *       400:
   *         description: Invalid token or password
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  api.post("/activate-account", async (req, res) => {
    try {
      const { password, token } = req.body;
      const { ok, data, message } = await AdminController.activateAccount(token, password);
      if (ok) {
        res.status(200).json({ ok, data });
      } else {
        res.status(400).json({ ok, message });
      }
    } catch (error) {
      res.status(500).json({ ok: false, message: error.message });
    }
  });

  /**
   * @swagger
   * /admin/reset-password:
   *   post:
   *     summary: Reset password
   *     description: Reset admin password using a reset token
   *     tags: [Adminentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TokenInput'
   *     responses:
   *       200:
   *         description: Password reset successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 ok:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/adminResponse'
   *       400:
   *         description: Invalid token or password
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  api.post("/reset-password", async (req, res) => {
    try {
      const { password, token } = req.body;
      const { ok, data, message } = await AdminController.resetPassword(token, password);
      if (ok) {
        res.status(200).json({ ok, data });
      } else {
        res.status(400).json({ ok, message });
      }
    } catch (error) {
      res.status(500).json({ ok: false, message: error.message });
    }
  });

  /**
   * @swagger
   * /admin:
   *   get:
   *     summary: Get admins
   *     description: Retrieve a list of admins with optional filters
   *     tags: [Adminentication]
   *     security:
   *       - bearerAdmin: []
   *     parameters:
   *       - in: query
   *         name: role
   *         schema:
   *           type: string
   *           enum: [admin, Enumerator]
   *         description: Filter admins by role
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [pending, active, disable]
   *         description: Filter admins by status
   *       - in: query
   *         name: isVerified
   *         schema:
   *           type: boolean
   *         description: Filter admins by verification status
   *     responses:
   *       200:
   *         description: List of admins retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 ok:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/adminResponse'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  api.get("/", async (req, res) => {
    try {
      const filter = req.query;
      const { ok, data, message } = await AdminController.getadmins(filter);
      if (ok) {
        res.status(200).json({ ok, message, data });
      } else {
        res.status(500).json({ ok, message, data });
      }
    } catch (error) {
      res.status(500).json({ ok: false, message: error.message });
    }
  });

  /**
   * @swagger
   * /admin/activate/{id}:
   *   put:
   *     summary: Activate admin (Admin only)
   *     description: Activate a admin account by ID. Only accessible by administrators.
   *     tags: [Adminentication]
   *     security:
   *       - bearerAdmin: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: admin ID
   *     responses:
   *       200:
   *         description: admin activated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 ok:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                 data:
   *                   $ref: '#/components/schemas/adminResponse'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  api.put("/activate/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { ok, data, message } = await AdminController.updateadmin(id, { isVerified: true });
      if (ok) {
        res.status(200).json({ ok, message, data });
      } else {
        res.status(500).json({ ok, message, data });
      }
    } catch (error) {
      res.status(500).json({ ok: false, message: error.message });
    }
  });

  /**
   * @swagger
   * /admin/{id}:
   *   put:
   *     summary: Update admin
   *     description: Update admin information by ID
   *     tags: [Adminentication]
   *     security:
   *       - bearerAdmin: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: admin ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/adminInput'
   *     responses:
   *       200:
   *         description: admin updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 ok:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                 data:
   *                   $ref: '#/components/schemas/adminResponse'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  api.put("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const body = req.body;
      const { ok, data, message } = await AdminController.updateadmin(id, body);
      if (ok) {
        res.status(200).json({ ok, message, data });
      } else {
        res.status(500).json({ ok, message, data });
      }
    } catch (error) {
      res.status(500).json({ ok: false, message: error.message });
    }
  });

  return api;
};