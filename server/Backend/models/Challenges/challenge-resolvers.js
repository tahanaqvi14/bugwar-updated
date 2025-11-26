import mongoose from "mongoose";
import { getUserModel } from '../../utils/getUserModel.js'
import Code from '../../code_verification/Code.js'
import isadminloggedin from '../../middleware/isadminloggedin.js';

const challenge_resolvers = {
    Query: {
        Get_challengeall: async (parent, args, context) => {
            const loggedIn = await isadminloggedin(context.req);
            if (loggedIn == false) {
                throw new Error("Not authenticated");
            }

            const ChallengeModel = getUserModel('Challenges')
            const challenges = await ChallengeModel.find({});
            return challenges;
        },
        check: async (parent, args, context) => {
            const loggedIn = await isadminloggedin(context.req);
            if (loggedIn == false) {
                return false;
            }
            return true;
        },
        Get_challenge: async (parent, args, context) => {
            const myId = args.idnum;
            const username = args.username;
            const UserModel = getUserModel('Users');
            // Get user info
            const userinfo = await UserModel.findOne({ username });
            const userLevel = userinfo?.sub_name?.toLowerCase();

            // Map user info to difficulty
            let difficultyFilter;
            if (userLevel === 'rookie') difficultyFilter = 'Easy';
            else if (userLevel === 'senior') difficultyFilter = 'Medium';
            else if (userLevel === 'pro') difficultyFilter = 'Hard';
            else difficultyFilter = ''; // fallback

            const ChallengeModel = getUserModel('Challenges');

            // Safely handle exclusion ID
            let excludeId = null;
            if (mongoose.Types.ObjectId.isValid(myId)) {
                excludeId = new mongoose.Types.ObjectId(myId);
            }

            // Get all challenges with difficulty, optionally excluding myId
            const challenges = await ChallengeModel.find({
                difficulty: new RegExp(`^${difficultyFilter}$`, 'i'),
                ...(excludeId ? { _id: { $ne: excludeId } } : {})
            });

            if (!challenges.length) return null;

            // Pick a random challenge from the filtered set
            const randomIndex = Math.floor(Math.random() * challenges.length);
            const challenge = challenges[randomIndex];

            // console.log('challenge', challenge);
            return challenge;
        },
        checking_user_code: async (parent, args, context) => {
            const ChallengeModel = getUserModel('Challenges')
            const challenge = await ChallengeModel.findById(args.input.challengeid);
            console.log('challeasdange',challenge)
            const result = await Code(args.input.code, challenge)
            console.log(result);
            return result;
        }
    },
    Mutation: {
        deleteChallenge: async (parent, args, context) => {
            const db = getUserModel('Challenges');
            const challenge = await db.findById(args.id_number);
            challenge

            if (!challenge) throw new Error("Challenge not found");

            await challenge.deleteOne();  // <-- FIXED

            return true;
        },
        updateChallenge: async (parent, args, context) => {
            const db = getUserModel('Challenges')
            const challenge = await db.findOne({ _id: args.input._id });
            if (!challenge) throw new Error("Challenge not found");

            const input = args.input;

            // Only update fields that changed
            Object.keys(input).forEach(key => {
                if (key === "_id") return; // never overwrite id
                const newValue = input[key];
                const oldValue = challenge[key];

                if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
                    challenge[key] = newValue;
                }
            });

            await challenge.save();
            return challenge;
        },
        createChallenge: async (_parent, args, context) => {
            try {
                const Challenge = getUserModel('Challenges');
                await Challenge.create({
                    function_name: args.input.function_name,
                    problem_statement: args.input.problem_statement,
                    difficulty: args.input.difficulty,
                    testcases: args.input.testcases
                });

                return true;   // 👈 IMPORTANT
            } catch (err) {
                console.error("Create challenge error:", err);
                return false;  // 👈 Return false if something failed
            }
        }
    }
};

export default challenge_resolvers;