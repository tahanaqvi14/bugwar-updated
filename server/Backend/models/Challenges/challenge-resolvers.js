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
        check:async (parent, args, context) => {
            const loggedIn = await isadminloggedin(context.req);
            if (loggedIn == false) {
                return false;
            }
            return true;
        },
        Get_challenge: async (parent, args, context) => {
            const myId = args.idnum
            let randomId;
            const ChallengeModel = getUserModel('Challenges')
            do {
                randomId = Math.floor(Math.random() * 2) + 1; // random 1 or 2
            } while (randomId === myId); // check if it matches your ID            
            const challenge = await ChallengeModel.find({ id_number: randomId })
            return challenge;
        },
        checking_user_code: async (parent, args, context) => {
            const ChallengeModel = getUserModel('Challenges')
            const challenge = await ChallengeModel.find({ id_number: args.input.challengeid })
            const result = await Code(args.input.code, challenge)
            return result;
        }
    },
    Mutation: {
        deleteChallenge: async (parent, args, context) => {
            const db = getUserModel('Challenges');
            const challenge = await db.findOne({ id_number: args.id_number });
        
            if (!challenge) throw new Error("Challenge not found");
        
            await challenge.deleteOne();  // <-- FIXED
        
            return true;
        },
        updateChallenge: async (parent, args, context) => {
            const db = getUserModel('Challenges')
            const challenge = await db.findOne({ id_number: args.input.id_number });
            if (!challenge) throw new Error("Challenge not found");
            
            const input = args.input;
            
            // Only update fields that changed
            Object.keys(input).forEach(key => {
                if (key === "id_number") return; // never overwrite id
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
        
                const count = await Challenge.countDocuments();
        
                await Challenge.create({
                    id_number: count + 1,
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