const AdminModel = require("../model/admin.model");
const jwt = require("jsonwebtoken");
// const EmailController = require("./email.controller");
const { jwtSecret } = require("../config");

class AdminController {
  constructor() {
    this.init();
  }

  async register(body) {
    try {
      body.password = "root";
      const newUser = new AdminModel(body);
      await newUser.save();
      newUser.password = "********";
      const token = this.encodeToken({ email: newUser.email, role: newUser.role, id: newUser._id });
      // await EmailController.welcomeEmailUser(newUser.email, token);

      return { ok: true, data: newUser, message: "Registration successful" };
    } catch (error) {
      return this.handleDuplicateKeyError(error);
    }
  }

  async login(email, password) {
    try {
      const user = await AdminModel.findOne({ email });
      if (!user) {
        throw new Error("User not found");
      }
      if (user.status !== "active") {
        throw new Error("User not activated or suspended");
      }

      const isValid = await user.isValidPassword(password);
      if (!isValid) {
        throw new Error("Invalid password");
      }
      await user.postLogin()

      const token = this.encodeToken(
        { email: user.email, role: user.role, id: user._id },
        // { expiresIn: "1h" }
      );

      return { ok: true, data: { user, token }, message: "Login successful" };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  }

  async getUsers(filter) {
    try {
      const users = await AdminModel.find(filter);
      return { ok: true, data: users, message: "Users fetched successfully" };
    } catch (error) {
      console.log("Error fetching users:", error.message);
      return { ok: false, message: error.message };
    }
  }

  async updateUser(id, newData) {
    try {
      const user = await AdminModel.findByIdAndUpdate(id, newData, { new: true });
      return { ok: true, data: user, message: user ? "User updated successfully" : "No record updated.. Data not found !!!" };
    } catch (error) {
      console.log("Error updating user:", error.message);
      return { ok: false, message: error.message };
    }
  }

  
  async recoverAccount(email) {
    try {
      const account = await AdminModel.findOne({ email });
      if (!account) {
        throw new Error("Account not found");
      }
      const token = this.encodeToken({ email: user.email, role: user.role, id: user._id }, { expiresIn: "1h" });

      // await EmailController.forgetPasswordUser(email, token);

      return { ok: true, message: "Instruction sent to your email" };
      
    } catch (error) {
      console.log("Error Recovering Account:", error.message);
      return { ok: false, message: error.message };
    }
  }

  async resetPassword(token, password) {
    try {
      const { email } = await this.decodeToken(token)
      const user = await AdminModel.findOne({ email });
      if (!user) {
        return { ok: false, message: "Account not found" };
      }
      if (!password) {
        return { ok: false, message: "Invalid password" };
      }
      await user.changePassword(password);
      return { ok: true, data: user, message: "password changed succesfully" };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  }

  async activateAccount(token, password) {
    try {
      console.log({token, password})
      const { email } = await this.decodeToken(token)
      console.log({email})
      const user = await AdminModel.findOne({ email });
      if (!user) {
        return { ok: false, message: "Account not found" };
      }
      if (!password) {
        return { ok: false, message: "Invalid password" };
      }
      await user.activateUser(password);
      return { ok: true, data: user, message: "password changed succesfully" };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  }

  encodeToken(payload, options = {}) {
    return jwt.sign(payload, jwtSecret, options);
  }

  decodeToken(token) {
    try {
      return jwt.verify(token, jwtSecret);
    } catch (error) {
      console.log("Token not verified:", error.message);
      throw new Error(error.message);
    }
  }

  async init() {
    try {
      const adminUser = await AdminModel.findOne({ email: "admin@system.com" });
      if (adminUser) {
        console.log("Admin User found >>> Skipping seeding ::::");
        return;
      }
      await AdminModel.ensureIndexes();
      const adminObj = {
        fullName: "super admin",
        email: "admin@system.com",
        phone: "08033445566",
        state: "Kaduna",
        lga: "Kudan",
        address: "root",
        city: "localhost",
        password: "0987654321",
        role: "admin",
        status: "active",
        isVerified: true
      };
      const newAdmin = new AdminModel(adminObj);
      const admin = await newAdmin.save({ isAdmin: true, validateBeforeSave: false });
      console.log("Seeded new admin account:", admin);
    } catch (error) {
      console.log("Error seeding admin account:", error.message);
    }
  }

  handleDuplicateKeyError(error) {
    if (error.code === 11000) {
      const matches = error.message.match(/index: (.+?) dup key: { (.+?) }/);
      if (matches) {
        const [, fieldName, fieldValue] = matches;
        return { ok: false, message: `A user with the '${fieldValue}' already exists.` };
      } else {
        return { ok: false, message: "A duplicate value was provided. Please check your information." };
      }
    } else {
      console.log("Error creating user:", error.message);
      return { ok: false, message: error.message };
    }
  }
}

module.exports = new AdminController();