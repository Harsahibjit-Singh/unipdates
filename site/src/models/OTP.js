// models/OTP.js
import mongoose from 'mongoose';

const OTPSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // OTP expires after 300 seconds (5 minutes)
  },
}, { timestamps: true });

export default mongoose.models.OTP || mongoose.model('OTP', OTPSchema);