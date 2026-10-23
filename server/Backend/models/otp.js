import mongoose from 'mongoose';

// One-time passwords for sign up and password reset.
// Only a hash of the code is stored, and MongoDB deletes the document automatically once expiresAt has passed.
const otp = mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    purpose: {
        type: String,
        required: true,
        enum: ['signup', 'reset']
    },
    codeHash: {
        type: String,
        required: true
    },
    attempts: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // TTL index: removed by MongoDB when this date is reached
    }
});

otp.index({ email: 1, purpose: 1 }, { unique: true }); // only one active code per email and purpose

export default otp;
