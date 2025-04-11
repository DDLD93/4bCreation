const UserModel = require("../model/user.model");
const redisCtrl = require("./redis.controller")
const emailController = require("./email.controller")
const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config");

class UserController {
  constructor() {
  }

  async register(body, isAdmin = false) {
    try {
      const { otp, email } = body;
      if(!isAdmin) {
        const value = await redisCtrl.read(`4bcreation-code-register:${email}`);
        console.log({value, otp});
        if (!value || value !== otp) throw new Error("Invalid or Expired code");
      }
      const newUser = new UserModel(body);
      await newUser.save();
      newUser.password = "********";
      // await emailController.welcomeEmailEnumerator(email, tempPassword);

      return {
        ok: true,
        data: newUser,
        message: "Registration successful",
      };
    } catch (error) {
      return this.handleDuplicateKeyError(error);
    }
  }


  async newRegister(body) {
    try {
      const { email, phone } = body;
      // check if user already exists BY EMAIL OR PHONE
        const user = await UserModel.findOne({ $or: [{ email }, { phone }] });
      if (user) {
        throw new Error("User already exists");
      }
      
      const newUser = new UserModel(userData);
      await newUser.save();
      
      // Send welcome email with credentials after successful user creation
      await emailController.welcomeEmailEnumerator(email, tempPassword);
      newUser.password = "********";
      return { ok: true, data: {...newUser, tempPassword}, message: "Registration successful" };
    } catch (error) {
      return this.handleDuplicateKeyError(error);
    }
  }

  async login(email, password) {
    try {
      const user = await EnumModel.findOne({ email });
      if (!user) {
        throw new Error("User not found");
      }
      
      const isValid = await user.isValidPassword(password);
      if (!isValid) {
        throw new Error("Invalid password");
      }

      if (user.status == "disable") {
        throw new Error("User is suspended");
      }

      if (user.status !== "active") {
        throw new Error("User is not actived [Contact Admin]");
      }

      await user.postLogin()

      const accessToken = this.encodeToken(
        { email: user.email, role: user.role, id: user._id },
        // { expiresIn: "1h" }
      );
      const refreshToken = this.encodeToken(
        { email: user.email, role: user.role, id: user._id }
      );
      await redisCtrl.write(`4bcreation-token::${user.email}`, refreshToken)

      return { ok: true, data: { user, accessToken, refreshToken }, message: "Login successful" };
    } catch (error) {
      console.log("Error logging in:", error.message);
      return { ok: false, message: error.message };
    }
  }

  async verifyEmail(email) {
    try {
      const user = await EnumModel.findOne({ email });
      if (user) {
        throw new Error("User with this email already exists");
      }
      return await this.sendOTPtoEmail(email)
    } catch (error) {
      console.log("Error verifying email:", error.message);
      return { ok: false, message: error.message };
    }
  }

  async getAccessToken(email, refreshToken) {
    try {
      const value = await redisCtrl.read(`4bcreation-token::${email}`);
      if (!value || value !== refreshToken) throw new Error("Invalid token");
      const user = this.decodeToken(value);
      const accessToken = this.encodeToken(
        { email: user.email, role: user.role, id: user._id },
        { expiresIn: "0.2h" }
      );

      return { ok: true, data: { accessToken } };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  }

  async recoverAccount(email) {
    try {
      const account = await UserModel.findOne({ email });
      if (!account) {
        throw new Error("Account not found");
      }
      return await this.sendOTPtoEmailAccountRecovery(email)
    } catch (error) {
      console.log("Error Recovering Account:", error.message);
      return { ok: false, message: error.message };
    }
  }

  async validateCode(otp, email) {
    try {
      const value = await redisCtrl.read(`4bcreation-code-reset:${otp}`);
      if (!email || value != email) throw new Error("Invalid or Expired code")
      const token = this.encodeToken({
        email
      }, { expiresIn: "0.1h" })
      return { ok: true, data: { token }, message: "password changed succesfully" };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  }

  async resetPassword(token, password) {
    try {
      const { email } = await this.decodeToken(token)
      const user = await UserModel.findOne({ email });
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
      const { email } = await this.decodeToken(token)
      const user = await EnumModel.findOne({ email });
      if (!user) {
        return { ok: false, message: "Account not found" };
      }
      if (!password) {
        return { ok: false, message: "Invalid password" };
      }
      await user.activateUser(password);
      await user.postLogin();

      const accessToken = this.encodeToken(
        { email: user.email, role: user.role, id: user._id },
        // { expiresIn: "1h" }
      );
      const refreshToken = this.encodeToken(
        { email: user.email, role: user.role, id: user._id }
      );
      await redisCtrl.write(`4bcreation-token::${user.email}`, refreshToken)
      return { ok: true, data: { user, accessToken, refreshToken }, message: "Account Activated succesfully" };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  }

  async getUsers(filter = {}, options = {}) {
    try {
      // Extract pagination parameters with defaults
      const page = parseInt(options.page) || 1;
      const limit = parseInt(options.limit) || 50;
      const skip = (page - 1) * limit;
      
      // Extract sorting parameters
      const sort = options.sort || { createdAt: -1 }; // Default sort by creation date
      
      // Count total documents for pagination metadata
      const total = await UserModel.countDocuments(filter);
      
      // Get paginated results
      const users = await UserModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit);
      
      // Calculate pagination metadata
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;
      
      return {
        ok: true,
        data: users,
        pagination: {
          total,
          totalPages,
          currentPage: page,
          limit,
          hasNext,
          hasPrev
        },
        message: `Found ${users.length} users (page ${page} of ${totalPages})`
      };
    } catch (error) {
      console.log("Error fetching users:", error.message);
      return { ok: false, message: error.message };
    }
  }

  async updateUser(id, newData) {
    try {
      const user = await UserModel.findByIdAndUpdate(id, newData, { new: true });
      return { ok: true, data: user, message: user ? "User updated successfully" : "No record updated.. Data not found !!!" };
    } catch (error) {
      console.log("Error updating user:", error.message);
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
      return null;
    }
  }

  async verifyCode(key, code) {
    try {
      const value = await redisCtrl.read(key);
      if (code === value) {
        return true
      } else {
        return false
      }
    } catch (error) {
      console.log("Token not verified:", error.message);
      return null;
    }
  }

  async sendOTPtoEmail(email) {
    try {
      const otp = this.generateSixDigitCode();
      await redisCtrl.write(`4bcreation-code-register:${email}`, otp);
      await emailController.verifyEmailEnumerator(email, otp);
      return { ok: true, message: "Six digit code sent to your email" }
    } catch (error) {
      return {
        ok: false,
        message: error.message
      }
    }
  }

  async sendOTPtoEmailAccountRecovery(email) {
    try {
      const otp = this.generateSixDigitCode();
      await redisCtrl.write(`4bcreation-code-reset:${otp}`, email);
      await emailController.forgetPasswordEnumerator(email, otp);
      return { ok: true, message: "Six digit code sent to your email" }
    } catch (error) {
      return {
        ok: false,
        message: error.message
      }
    }
  }

  generateSixDigitCode() {
    let code = '';
    while (code.length < 6) {
      let digit = Math.floor(Math.random() * 9) + 1;
      code += digit;
    }
    return code;
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

  generateTemporaryPassword() {
    const length = 8;
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '@#$%&*';
    
    let password = '';
    
    // Ensure at least one of each character type
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += special.charAt(Math.floor(Math.random() * special.length));
    
    // Fill the rest randomly
    const allChars = uppercase + lowercase + numbers + special;
    for(let i = password.length; i < length; i++) {
        password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}

module.exports = new UserController();
