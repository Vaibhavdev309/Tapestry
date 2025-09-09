import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
      match: [/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces']
    },
    email: { 
      type: String, 
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: { 
      type: String, 
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long']
    },
    cartData: { 
      type: Object, 
      default: {},
      validate: {
        validator: function(v) {
          return typeof v === 'object' && v !== null;
        },
        message: 'Cart data must be an object'
      }
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: {
      type: Date,
      default: null
    }
  },
  { 
    minimize: false,
    timestamps: true
  }
);

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });

const userModel = mongoose.models.user || mongoose.model("User", userSchema);

export default userModel;
