import userModel from "../models/userModel.js";
import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import emailService from "../services/emailService.js";

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await userModel.findOne({ email, isActive: true });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }
    
    // Update last login
    await userModel.findByIdAndUpdate(user._id, { lastLogin: new Date() });
    
    // Create token
    const token = createToken(user._id);
    
    res.json({ 
      success: true, 
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
};

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const exists = await userModel.findOne({ email });
    if (exists) {
      return res.status(409).json({ 
        success: false, 
        message: "User already exists with this email" 
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const newUser = new userModel({ 
      name, 
      email, 
      password: hashedPassword 
    });
    
    const user = await newUser.save();
    const token = createToken(user._id);
    
    // Send welcome email (async, don't wait for it)
    emailService.sendWelcomeEmail(user).catch(error => {
      console.error("Failed to send welcome email:", error);
    });
    
    res.status(201).json({ 
      success: true, 
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      message: "User registered successfully"
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ 
        success: false, 
        message: "User already exists with this email" 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
};

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Email and password are required" 
      });
    }
    
    // Check credentials
    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      // Create secure JWT token with admin role and expiration
      const token = jwt.sign(
        { 
          id: 'admin',
          role: 'admin',
          email: email 
        }, 
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      res.json({ 
        success: true, 
        token,
        message: "Admin login successful"
      });
    } else {
      res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
};

export { loginUser, registerUser, adminLogin };
