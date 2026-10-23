import { getUserModel } from '../../utils/getUserModel.js'
import { requireUser } from '../../utils/auth.js';

const toIso = (value) => (value ? new Date(value).toISOString() : null);

const match_resolvers = {

    Query: {
        Get_matchinfo: async (parent, args, context) => {
            const username = requireUser(context);
            const MatchModel = getUserModel('Matches');
            const match = await MatchModel.findOne({ matchId: args.matchId }).lean();

            // Only players of the match can look at it
            if (!match || !match.participants.some(p => p.username === username)) {
                return null;
            }

            return {
                ...match,
                serverTime: new Date().toISOString(),
            };
        },
        Get_allmatch: async (parent, args, context) => {
            const username = requireUser(context);
            const MatchModel = getUserModel('Matches');
            return MatchModel.find({ "participants.username": username }).sort({ matchDate: -1 }).lean();
        },
    },

    // Dates are always sent to the browser as ISO strings
    Match: {
        matchDate: (match) => toIso(match.matchDate),
        endTime: (match) => toIso(match.endTime),
    },
};

export default match_resolvers;
