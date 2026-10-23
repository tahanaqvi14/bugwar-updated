import { getUserModel } from '../../utils/getUserModel.js'
import { v4 as uuidv4 } from 'uuid';

// Server-only match logic, used by the Socket.IO game handlers.
// These used to be GraphQL mutations, which meant any browser could call them and change scores.

// 10 minutes (MATCH_DURATION_MS can shorten it, e.g. for testing or a classroom demo)
export const MATCH_DURATION = Number(process.env.MATCH_DURATION_MS) || 10 * 60 * 1000;
export const POINTS_PER_SOLVE = 10;

function rankForPoints(points, currentRank) {
    if (points >= 200) return "Pro";
    if (points >= 50) return "Senior";
    return currentRank;
}

// Adds each player's match points to their account and updates their rank.
async function creditPlayers(match) {
    const UserModel = getUserModel('Users');

    for (const player of match.participants) {
        const updatedUser = await UserModel.findOneAndUpdate(
            { username: player.username },
            {
                $inc: { points: player.points },
                $addToSet: { total_matches: match.matchId }
            },
            { new: true } // no upsert: never create half-empty users
        );
        if (!updatedUser) continue;

        const newSubName = rankForPoints(updatedUser.points, updatedUser.sub_name);
        if (newSubName !== updatedUser.sub_name) {
            await UserModel.updateOne(
                { username: player.username },
                { $set: { sub_name: newSubName } }
            );
        }
    }
}

export async function createMatch(usernames) {
    if (new Set(usernames).size !== usernames.length) {
        throw new Error('A match needs two different players');
    }

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

    const MatchModel = getUserModel('Matches');
    const now = new Date();
    const matchinfo = await MatchModel.create({
        matchId: uuidv4(),
        participants,
        endTime: new Date(now.getTime() + MATCH_DURATION)
    });

    return {
        ...matchinfo.toObject(),
        endTime: matchinfo.endTime.toISOString(),
        matchDate: matchinfo.matchDate.toISOString(),
        serverTime: new Date().toISOString(),
    };
}

// Adds points to one player. Atomic ($inc), so two quick solves can't overwrite each other.
export async function addPoints(matchId, username) {
    const MatchModel = getUserModel('Matches');
    const match = await MatchModel.findOneAndUpdate(
        { matchId, status: 'Incomplete', 'participants.username': username },
        { $inc: { 'participants.$.points': POINTS_PER_SOLVE } },
        { new: true }
    );
    if (!match) {
        throw new Error('Match not found, already finished, or user not in this match');
    }
    return match;
}

// Normal end of a match (timer ran out).
export async function endMatch(matchId) {
    const MatchModel = getUserModel('Matches');

    // Switch the status first, atomically. If two calls race, only one gets the match back,
    // so points are never credited twice.
    const match = await MatchModel.findOneAndUpdate(
        { matchId, status: 'Incomplete' },
        { $set: { status: 'Completed' } },
        { new: true }
    );
    if (!match) {
        return MatchModel.findOne({ matchId }); // already finished
    }

    await creditPlayers(match);

    // Determine Winner ("N" means draw)
    const [p1, p2] = match.participants;
    let winner = "N";
    if (p1 && p2) {
        if (p1.points > p2.points) {
            winner = p1.username;
        } else if (p2.points > p1.points) {
            winner = p2.username;
        }
    }

    match.winner = winner;
    await match.save();
    return match;
}

// A player left before the end: the opponent wins, both keep the points they earned.
export async function interruptMatch(matchId, leaverUsername) {
    const MatchModel = getUserModel('Matches');

    const match = await MatchModel.findOneAndUpdate(
        { matchId, status: 'Incomplete' },
        { $set: { status: 'Interrupted' } },
        { new: true }
    );
    if (!match) {
        return MatchModel.findOne({ matchId });
    }

    await creditPlayers(match);

    const opponent = match.participants.find(p => p.username !== leaverUsername);
    match.winner = opponent ? opponent.username : "tobedecided";
    await match.save();
    return match;
}

// Removes a match that never really started (opponent disconnected while it was being created).
export async function cancelMatch(matchId) {
    await getUserModel('Matches').deleteOne({ matchId, status: 'Incomplete' });
}

// After a restart, matches that were running are finished so their points are not lost.
export async function finishStaleMatches() {
    const MatchModel = getUserModel('Matches');
    const stale = await MatchModel.find({ status: 'Incomplete' }, { matchId: 1 });
    for (const { matchId } of stale) {
        await endMatch(matchId);
    }
    if (stale.length > 0) {
        console.log(`Finished ${stale.length} match(es) left over from before the restart`);
    }
}
