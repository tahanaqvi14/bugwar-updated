import mongoose from 'mongoose';
import { requireEnv } from '../config.js';

async function connectToDatabase() {
    try {
        // (useNewUrlParser / useUnifiedTopology are no longer needed: they are the default since Mongoose 6)
        await mongoose.connect(requireEnv('MONGO_URI'));

        console.log("✅ MongoDB Connected Successfully");

    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err.message);
        process.exit(1);
    }
};


export default connectToDatabase;
