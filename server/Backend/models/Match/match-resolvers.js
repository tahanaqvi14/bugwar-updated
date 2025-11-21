import { getUserModel } from '../../utils/getUserModel.js'
import { v4 as uuidv4 } from 'uuid';

const MATCH_DURATION = 0.5 * 60 * 1000; // 10 minutes

const challenge_resolvers = {

    Query: {
        Get_matchinfo: async (parent, args, context) => {
            const MatchModel = getUserModel('Matches');
            const match = await MatchModel.findOne({ matchId: args.matchId });

            if (!match) {
                return {
                    endTime: null,
                    serverTime: new Date().toISOString(),
                };
            }

            // If using Mongoose, convert document to plain object first
            const matchObj = match.toObject ? match.toObject() : match;

            return {
                ...matchObj,
                endTime: matchObj.endTime ? matchObj.endTime.toISOString() : null,
                serverTime: new Date().toISOString(),
            };
        }
    },
    Mutation: {
        endgame: async (parent, args, context) => {
            console.log('🔵 endgame called for matchId:', args.matchId);

            const MatchModel = getUserModel('Matches');
            const UserModel = getUserModel('Users');

            const match = await MatchModel.findOne({ matchId: args.matchId });

            if (!match) {
                throw new Error("Match not found");
            }

            if (match.status === "Completed") {
                console.log("Match already completed — skipping update");
                return match;
            }

            const users = match.participants;

            for (const player of users) {

                // First update points & match history
                const updatedUser = await UserModel.findOneAndUpdate(
                    { username: player.username },
                    {
                        $inc: { points: player.points },
                        $push: { total_matches: match.matchId }
                    },
                    { new: true, upsert: true }
                );

                // Rank update logic
                let newSubName = updatedUser.sub_name; // default = keep existing

                if (updatedUser.points >= 200) {
                    newSubName = "Pro";
                } else if (updatedUser.points >= 50 && updatedUser.points < 200) {
                    newSubName = "Senior";
                }

                // Only update DB if changed
                if (newSubName !== updatedUser.sub_name) {
                    await UserModel.updateOne(
                        { username: player.username },
                        { $set: { sub_name: newSubName } }
                    );
                }
            }

            // Determine Winner
            const [p1, p2] = users;
            let winner = "N";

            if (p1.points > p2.points) {
                winner = p1.username;
            } else if (p2.points > p1.points) {
                winner = p2.username;
            }

            // Save match status
            match.status = "Completed";
            match.winner = winner;
            await match.save();

            return match;
        },
        createMatch: async (parent, args, context) => {
            const usernames = args.input;
            const UserModel = getUserModel('Users');
            const users = await UserModel.find({ username: { $in: usernames } });

            if (users.length !== usernames.length) {
                throw new Error('One or more users not found');
            }

            const userMap = users.reduce((acc, user) => {
                acc[user.username] = user.displayname;
                return acc;
            }, {});

            // Build participants array
            const participants = usernames.map(u => ({
                username: u,
                displayname: userMap[u], // get displayname from lookup
                points: 0
            }));


            const matchId = uuidv4();
            const MatchModel = getUserModel('Matches');

            // CALCULATE endTime
            const now = new Date();
            const endTime = new Date(now.getTime() + MATCH_DURATION);

            const matchinfo = await MatchModel.create({
                matchId: matchId,
                participants,
                endTime: endTime       // ADD: End time
            })
            // CALCULATE endTime
            let forwardingV = matchinfo.toObject();

            // forwardingV.participants.forEach((participant, index) => {
            //     participant.displayName = users[index].displayname;
            // });

            // ADD serverTime
            forwardingV.serverTime = new Date().toISOString();
            return forwardingV;
        },

        updatematchpoint: async (parent, args, context) => {
            let matchId = args.matchId;
            let username = args.username
            const MatchModel = getUserModel('Matches');

            // Find match
            const match = await MatchModel.findOne({ matchId });
            if (!match) {
                throw new Error('Match not found');
            }

            // Find participant index
            const participantIndex = match.participants.findIndex(
                (p) => p.username === username
            );

            if (participantIndex === -1) {
                throw new Error('User not found in this match');
            }

            // Update points
            match.participants[participantIndex].points += 10;

            // Save match
            await match.save();

            return {
                match,

            };

        },
        matchinterrupt: async (parent, args, context) => {
            let { matchId, username } = args;

            const MatchModel = getUserModel('Matches');
            const UserModel = getUserModel('Users');

            // Find match
            const match = await MatchModel.findOne({ matchId });
            if (!match) throw new Error('Match not found');

            const opponent = match.participants.find(p => p.username !== username);
            const users = match.participants;

            for (const player of users) {
                // First update the points & match history
                const updatedUser = await UserModel.findOneAndUpdate(
                    { username: player.username },
                    {
                        $inc: { points: player.points },
                        $push: { total_matches: match.matchId }
                    },
                    { new: true, upsert: true }
                );

                // Now check updated points to assign sub_name
                let newSubName = updatedUser.sub_name; // keep current if no change

                if (updatedUser.points >= 200) {
                    newSubName = "Pro";
                } else if (updatedUser.points >= 50 && updatedUser.points < 200) {
                    newSubName = "Senior";
                }

                if (newSubName !== updatedUser.sub_name) {
                    await UserModel.updateOne(
                        { username: player.username },
                        { $set: { sub_name: newSubName } }
                    );
                }
            }

            // Update match status and winner
            match.status = "Interrupted";
            match.winner = opponent ? opponent.username : "tobedecided";
            await match.save();

            return { match };
        }

    }
};

export default challenge_resolvers;