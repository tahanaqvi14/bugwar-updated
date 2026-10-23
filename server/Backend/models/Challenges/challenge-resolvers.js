import mongoose from "mongoose";
import { getUserModel } from '../../utils/getUserModel.js'
import Code from '../../code_verification/Code.js'
import isadminloggedin from '../../middleware/isadminloggedin.js';
import { requireUser, requireAdmin } from '../../utils/auth.js';
import { validate, challengeSchema } from '../../utils/validation.js';
import {
    getServedChallenges,
    clearServedChallenges,
    setCurrentChallenge,
    recordSolved
} from '../../game/state.js';

const DIFFICULTY_FOR_RANK = {
    rookie: 'Easy',
    senior: 'Medium',
    pro: 'Hard',
};

// Players currently waiting for the code runner, so one player can't flood it with runs.
const runningUsers = new Set();

function toObjectIds(ids) {
    return ids.filter((id) => mongoose.Types.ObjectId.isValid(id)).map((id) => new mongoose.Types.ObjectId(id));
}

const challenge_resolvers = {
    Query: {
        Get_challengeall: async (parent, args, context) => {
            requireAdmin(context);
            const ChallengeModel = getUserModel('Challenges')
            return ChallengeModel.find({}).sort({ difficulty: 1, function_name: 1 });
        },
        check: async (parent, args, context) => {
            return isadminloggedin(context.req);
        },
        Get_challenge: async (parent, args, context) => {
            // The username comes from the session, not from the browser
            const username = requireUser(context);
            const UserModel = getUserModel('Users');
            const userinfo = await UserModel.findOne({ username }, 'sub_name').lean();
            const difficulty = DIFFICULTY_FOR_RANK[userinfo?.sub_name?.toLowerCase()] ?? 'Easy';

            const ChallengeModel = getUserModel('Challenges');

            // Don't repeat a challenge this player already got in the current match (no A → B → A)
            let excluded = toObjectIds([...getServedChallenges(username), args.idnum].filter(Boolean));
            let challenges = await ChallengeModel.find({ difficulty, _id: { $nin: excluded } });

            // Every challenge of this level was already played: start over (but not with the one just solved)
            if (!challenges.length) {
                clearServedChallenges(username);
                excluded = toObjectIds([args.idnum].filter(Boolean));
                challenges = await ChallengeModel.find({ difficulty, _id: { $nin: excluded } });
            }
            if (!challenges.length) {
                challenges = await ChallengeModel.find({ difficulty });
            }
            if (!challenges.length) return null;

            // Pick a random challenge from the filtered set
            const challenge = challenges[Math.floor(Math.random() * challenges.length)];
            setCurrentChallenge(username, challenge._id.toString());
            return challenge;
        },
        checking_user_code: async (parent, args, context) => {
            const username = requireUser(context);
            const { code, challengeid } = args.input;

            if (!mongoose.Types.ObjectId.isValid(challengeid)) {
                return { success: false, message: { message: 'Challenge not found' } };
            }
            if (typeof code !== 'string' || code.length > 20000) {
                return { success: false, message: { message: 'Code is too long (max 20,000 characters)' } };
            }
            if (runningUsers.has(username)) {
                return { success: false, message: { message: 'Your previous run is still running, please wait' } };
            }

            const ChallengeModel = getUserModel('Challenges')
            const challenge = await ChallengeModel.findById(challengeid).lean();
            if (!challenge) {
                return { success: false, message: { message: 'Challenge not found' } };
            }

            runningUsers.add(username);
            try {
                const result = await Code(code, challenge);
                // Remember a verified solve; the game only awards points for verified solves
                if (result.success && result.message.passed) {
                    recordSolved(username, challenge._id.toString());
                }
                return result;
            } finally {
                runningUsers.delete(username);
            }
        }
    },
    Mutation: {
        deleteChallenge: async (parent, args, context) => {
            requireAdmin(context);
            if (!mongoose.Types.ObjectId.isValid(args.id_number)) throw new Error("Challenge not found");

            const db = getUserModel('Challenges');
            const deleted = await db.findByIdAndDelete(args.id_number);
            if (!deleted) throw new Error("Challenge not found");
            return true;
        },
        updateChallenge: async (parent, args, context) => {
            requireAdmin(context);
            const { value, error } = validate(challengeSchema, args.input);
            if (error) throw new Error(error);
            if (!mongoose.Types.ObjectId.isValid(value._id)) throw new Error("Challenge not found");

            const db = getUserModel('Challenges')
            const challenge = await db.findById(value._id);
            if (!challenge) throw new Error("Challenge not found");

            challenge.function_name = value.function_name;
            challenge.problem_statement = value.problem_statement;
            challenge.difficulty = value.difficulty;
            challenge.input_type = value.input_type;
            challenge.testcases = value.testcases;

            await challenge.save();
            return challenge;
        },
        createChallenge: async (_parent, args, context) => {
            requireAdmin(context);
            const { value, error } = validate(challengeSchema, args.input);
            if (error) throw new Error(error);

            const Challenge = getUserModel('Challenges');
            await Challenge.create({
                function_name: value.function_name,
                problem_statement: value.problem_statement,
                difficulty: value.difficulty,
                input_type: value.input_type,
                testcases: value.testcases
            });
            return true;
        }
    }
};

export default challenge_resolvers;
