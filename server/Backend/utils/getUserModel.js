import mongoose from 'mongoose'

// utils/getUserModel.js
import userSchema from '../models/user.js';
import challengeSchema from '../models/challenge.js';
import matchSchema from '../models/match.js';
import otpSchema from '../models/otp.js';


const schemaMap = {
  Users: userSchema,
  Challenges: challengeSchema,
  Matches: matchSchema,
  Otps: otpSchema
};

// This object remembers created models (to avoid errors or duplicate models)
const modelCache = {};

export function getUserModel(collectionName) {
  if (!schemaMap[collectionName]) {
    throw new Error(`Unknown collection ${collectionName}`);
  }

  const usersDB = mongoose.connection.useDb('Game');  // Use the right DB

  // If model for this collection doesn't exist yet, create it
  if (!modelCache[collectionName]) {
    modelCache[collectionName] = usersDB.model(
      collectionName,       // Name of the model
      schemaMap[collectionName],           // The schema you're using
      collectionName        // Name of the actual collection in MongoDB
    );
  }

  // Return the model (either newly created or from cache)
  return modelCache[collectionName];
}
