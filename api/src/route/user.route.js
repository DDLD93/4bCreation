const AuthController = require("../controller/user.controller");
const express = require("express");

// const { base64toURL, rollbackUpload } = require("../middleware/upload.middleware");

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - fullName
 *         - phone
 *         - email
 *         - password
 *         - state
 *         - lga
 *         - unit
 *         - picture
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated unique identifier
 *         fullName:
 *           type: string
 *           description: Full name of the user
 *         phone:
 *           type: string
 *           description: Phone number (must be unique)
 *         email:
 *           type: string
 *           format: email
 *           description: Email address (must be unique)
 *         password:
 *           type: string
 *           format: password
 *           description: Account password
 *         state:
 *           type: string
 *           default: "Kaduna"
 *           description: State of operation
 *         lga:
 *           type: string
 *           default: "Kudan"
 *           description: Local Government Area
 *         unit:
 *           type: string
 *           description: Operating unit
 *         picture:
 *           type: string
 *           description: Profile picture URL
 *         status:
 *           type: string
 *           enum: [pending, active, disable]
 *           default: pending
 *           description: Account status
 *         isVerified:
 *           type: boolean
 *           default: false
 *           description: Email verification status
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           description: Timestamp of last login
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of account creation
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of last update
 *     UserResponse:
 *       type: object
 *       properties:
 *         ok:
 *           type: boolean
 *           description: Operation success status
 *         data:
 *           oneOf:
 *             - $ref: '#/components/schemas/User'
 *             - type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *             - type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *             - type: null
 *         message:
 *           type: string
 *           description: Response message
 */

module.exports = () => {
  const api = new express.Router();

  /**
   * @swagger
   * /api/v1/user/register:
   *   post:
   *     summary: Register a new user
   *     description: Create a new user account with the provided data
   *     tags: [Users]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - fullName
   *               - phone
   *               - email
   *               - unit
   *               - picture
   *             properties:
   *               fullName:
   *                 type: string
   *               phone:
   *                 type: string
   *               email:
   *                 type: string
   *                 format: email
   *               unit:
   *                 type: string
   *               picture:
   *                 type: string
   *                 format: base64
   *               state:
   *                 type: string
   *                 default: "Kaduna"
   *               lga:
   *                 type: string
   *                 default: "Kudan"
   *     responses:
   *       201:
   *         description: User registered successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserResponse'
   *       400:
   *         description: Invalid input data or duplicate entry
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserResponse'
   */

  api.post("/register", async (req, res) => {
    try {
      const body = req.body;
      const { ok, data, message } = await AuthController.register(body);
      if (!ok) throw new Error(message);
      res.status(201).json({ ok, data, message });
    } catch (error) {
      res.status(400).json({ ok: false, message: error.message });
    }
  });

  api.post("/register-admin", async (req, res) => {
    try {
      const body = req.body;
      const { ok, data, message } = await AuthController.register(body, true);
      if (!ok) throw new Error(message);
      res.status(201).json({ ok, data, message });
    } catch (error) {
      res.status(400).json({ ok: false, message: error.message });
    }
  });


  api.post("/verify-email", async (req, res) => {
    try {
      const { email } = req.body;
      const { ok, message } = await AuthController.verifyEmail(email);
      if (ok) {
        res.status(200).json({ ok, message });
      } else {
        res.status(500).json({ ok, message });
      }
    } catch (error) {
      res.status(500).json({ ok: false, message: error.message });
    }
  });

  /**
   * @swagger
   * /api/v1/user/login:
   *   post:
   *     summary: Login user
   *     description: Authenticate a user and get access tokens
   *     tags: [Users]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *                 format: password
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserResponse'
   *       400:
   *         description: Invalid credentials
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserResponse'
   */
  api.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const { ok, data, message } = await AuthController.login(email, password);
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
   * /api/v1/user/refresh-token:
   *   post:
   *     summary: Refresh access token
   *     description: Get a new access token using refresh token
   *     tags: [Users]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - refreshToken
   *               - email
   *             properties:
   *               refreshToken:
   *                 type: string
   *               email:
   *                 type: string
   *                 format: email
   *     responses:
   *       200:
   *         description: New access token generated successfully
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
   *                     accessToken:
   *                       type: string
   *       400:
   *         description: Invalid refresh token
   */
  api.post("/refresh-token", async (req, res) => {
    const { refreshToken, email } = req.body;
    try {
      const { ok, data, message } = await AuthController.getAccessToken(email, refreshToken);
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
   * /api/v1/user/recover-account:
   *   post:
   *     summary: Initiate account recovery
   *     description: Send recovery code to user's email
   *     tags: [Users]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *     responses:
   *       200:
   *         description: Recovery code sent successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 ok:
   *                   type: boolean
   *                 message:
   *                   type: string
   *       400:
   *         description: Account not found
   */
  api.post("/recover-account", async (req, res) => {
    try {
      const { email } = req.body;
      const { ok, message } = await AuthController.recoverAccount(email);
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
   * /api/v1/user/validate-code:
   *   post:
   *     summary: Validate recovery code
   *     description: Validate the recovery code sent to email
   *     tags: [Users]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - otp
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               otp:
   *                 type: string
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
   *                 data:
   *                   type: object
   *                   properties:
   *                     token:
   *                       type: string
   *                 message:
   *                   type: string
   *       500:
   *         description: Invalid or expired code
   */
  api.post("/validate-code", async (req, res) => {
    try {
      const { email, otp } = req.body;
      const { ok, data, message } = await AuthController.validateCode(otp, email);
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
   * /api/v1/user/reset-password:
   *   post:
   *     summary: Reset password
   *     description: Reset password using recovery token
   *     tags: [Users]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - token
   *               - password
   *             properties:
   *               token:
   *                 type: string
   *               password:
   *                 type: string
   *                 format: password
   *     responses:
   *       200:
   *         description: Password reset successful
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserResponse'
   *       400:
   *         description: Invalid token or password
   */
  api.post("/reset-password", async (req, res) => {
    try {
      const { password, token } = req.body;
      const { ok, data, message } = await AuthController.resetPassword(token, password);
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
   * /api/v1/user/activate-account:
   *   post:
   *     summary: Activate user account
   *     description: Activate a user's account
   *     tags: [Users]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - token
   *               - password
   *     responses:
   *       200:
   *         description: Account activated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserResponse'
   *       400:
   *         description: Invalid token or password
   *       500:
   *         description: Server error
   * 
   */
  api.post("/activate-account", async (req, res) => {
    try {
      const { password, token } = req.body;
      const { ok, data, message } = await AuthController.activateAccount(token, password);
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
   * /api/v1/user:
   *   get:
   *     summary: Get all users
   *     description: Retrieve a list of all users with optional filters
   *     tags: [Users]
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [pending, active, disable]
   *         description: Filter by account status
   *       - in: query
   *         name: isVerified
   *         schema:
   *           type: boolean
   *         description: Filter by verification status
   *     responses:
   *       200:
   *         description: Successfully retrieved users
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserResponse'
   *       500:
   *         description: Server error
   */
  api.get("/", async (req, res) => {
    try {
      const filter = req.query;
      const { ok, data, message } = await AuthController.getUsers(filter);
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
   * /api/v1/user/activate/{id}:
   *   put:
   *     summary: Activate user account
   *     description: Activate a user's account (admin only)
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The user ID
   *     responses:
   *       200:
   *         description: Account activated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserResponse'
   *       500:
   *         description: Server error
   */
  api.put("/activate/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { ok, data, message } = await AuthController.updateUser(id, { status: 'active' });
      if (ok) {
        res.status(200).json({ ok, message, data });
      } else {
        res.status(500).json({ ok, message, data });
      }
    } catch (error) {
      res.status(500).json({ ok: false, message: error.message });
    }
  });

  api.put("/deactivate/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { ok, data, message } = await AuthController.updateUser(id, { status: 'disable' });
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
   * /api/v1/user/{id}:
   *   put:
   *     summary: Update user
   *     description: Update a user's information
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The user ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/User'
   *     responses:
   *       200:
   *         description: User updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserResponse'
   *       500:
   *         description: Server error
   */
  api.put("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const body = req.body;
      const { ok, data, message } = await AuthController.updateUser(id, body);
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
