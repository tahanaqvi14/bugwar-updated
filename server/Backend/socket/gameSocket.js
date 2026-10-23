import {
    createMatch,
    addPoints,
    endMatch,
    interruptMatch,
    cancelMatch
} from '../models/Match/match-service.js';
import {
    addOnlineSocket,
    removeOnlineSocket,
    resetChallengeProgress,
    consumeSolved
} from '../game/state.js';

// Matchmaking and live match events.
// Every match gets its own Socket.IO room (named after its matchId), so any number of games can run at once,
// and players always leave the room when a match ends, is cancelled or someone disconnects.

const waitingQueue = [];        // players searching: [{ socketId, username }]
const matches = new Map();      // roomId -> { matchId, players, endTime, timer, finishing }
const roomOfSocket = new Map(); // socketId -> roomId
const creatingFor = new Set();  // usernames whose match is being created right now

const toPlain = (doc) => (doc?.toObject ? doc.toObject() : doc);

function isUserBusy(username) {
    if (creatingFor.has(username)) return true;
    if (waitingQueue.some((p) => p.username === username)) return true;
    for (const match of matches.values()) {
        if (match.players.some((p) => p.username === username)) return true;
    }
    return false;
}

function leaveQueue(socketId) {
    const index = waitingQueue.findIndex((p) => p.socketId === socketId);
    if (index !== -1) waitingQueue.splice(index, 1);
}

// Every handler goes through this: an error is logged and reported to that player only.
// Before, an exception in any async handler was an unhandled rejection, which stops the whole Node process.
function on(socket, eventName, handler) {
    socket.on(eventName, async (...args) => {
        try {
            await handler(...args);
        } catch (error) {
            console.error(`Socket event "${eventName}" failed:`, error);
            socket.emit('server_error', { event: eventName, message: 'Something went wrong, please try again' });
        }
    });
}

function cleanupMatch(io, roomId) {
    const match = matches.get(roomId);
    if (!match) return;
    clearTimeout(match.timer);
    for (const player of match.players) {
        roomOfSocket.delete(player.socketId);
        io.sockets.sockets.get(player.socketId)?.leave(roomId);
    }
    matches.delete(roomId);
}

async function finishMatch(io, roomId) {
    const match = matches.get(roomId);
    if (!match || match.finishing) return;
    match.finishing = true;
    clearTimeout(match.timer);

    try {
        await endMatch(match.matchId);
    } catch (error) {
        console.error('endMatch failed:', error);
    }
    io.to(roomId).emit('completed');
    cleanupMatch(io, roomId);
}

async function handlePlayerLeft(io, socketId) {
    const roomId = roomOfSocket.get(socketId);
    if (!roomId) return;
    const match = matches.get(roomId);
    if (!match || match.finishing) {
        roomOfSocket.delete(socketId);
        return;
    }
    match.finishing = true;
    clearTimeout(match.timer);

    const leaver = match.players.find((p) => p.socketId === socketId);
    let updatedMatch = null;
    try {
        updatedMatch = await interruptMatch(match.matchId, leaver?.username);
    } catch (error) {
        console.error('interruptMatch failed:', error);
    }
    io.to(roomId).emit('other_player_left', toPlain(updatedMatch));
    cleanupMatch(io, roomId);
}

async function joinQueue(io, socket) {
    const username = socket.data.username;

    if (isUserBusy(username)) {
        socket.emit('search_error', { message: 'You are already searching for or playing a match' });
        return;
    }

    // Find someone else who is still connected
    let opponent = null;
    while (waitingQueue.length > 0 && !opponent) {
        const candidate = waitingQueue.shift();
        if (io.sockets.sockets.get(candidate.socketId)?.connected) opponent = candidate;
    }

    if (!opponent) {
        waitingQueue.push({ socketId: socket.id, username });
        return;
    }

    const players = [opponent, { socketId: socket.id, username }];
    // Reserve both players before the database call, so a third search can't grab them meanwhile
    players.forEach((p) => creatingFor.add(p.username));

    let matchinfo;
    try {
        matchinfo = await createMatch(players.map((p) => p.username));
    } catch (error) {
        console.error('createMatch failed:', error);
        for (const p of players) {
            io.sockets.sockets.get(p.socketId)?.emit('search_error', { message: 'Could not start the match, please search again' });
        }
        return;
    } finally {
        players.forEach((p) => creatingFor.delete(p.username));
    }

    // Someone disconnected while the match was being created
    const sockets = players.map((p) => io.sockets.sockets.get(p.socketId));
    if (sockets.some((s) => !s?.connected)) {
        await cancelMatch(matchinfo.matchId);
        for (const s of sockets) {
            if (s?.connected) s.emit('search_error', { message: 'Your opponent left, please search again' });
        }
        return;
    }

    const roomId = matchinfo.matchId;
    const endTime = new Date(matchinfo.endTime).getTime();
    const match = { matchId: matchinfo.matchId, players, endTime, timer: null, finishing: false };
    matches.set(roomId, match);

    players.forEach((p, i) => {
        roomOfSocket.set(p.socketId, roomId);
        sockets[i].join(roomId);
        resetChallengeProgress(p.username);
    });

    // The server ends the match itself when time is up (it no longer depends on a browser saying so)
    match.timer = setTimeout(() => {
        finishMatch(io, roomId).catch((error) => console.error('finishMatch failed:', error));
    }, Math.max(0, endTime - Date.now()) + 1000);

    io.to(roomId).emit('2players_connected', { matchinfo });
}

// A player says they solved their challenge. Points are only given if the code runner
// verified a passing solution for the challenge the server handed to this player.
async function awardSolve(io, socket, payload) {
    const username = socket.data.username;
    const roomId = roomOfSocket.get(socket.id);
    const match = matches.get(roomId);
    if (!match || match.finishing || Date.now() > match.endTime) return;

    const challengeId = typeof payload?.challengeId === 'string' ? payload.challengeId : null;
    if (!challengeId || !consumeSolved(username, challengeId)) {
        socket.emit('server_error', { event: 'next_challenge', message: 'Solution not verified, submit it again' });
        return;
    }

    const updatedMatch = await addPoints(match.matchId, username);
    io.to(roomId).emit('notify', username, toPlain(updatedMatch));
}

export default function registerGameSocket(io, sessionMiddleware) {
    // Run express-session for the socket's handshake request so socket.request.session is available.
    io.use((socket, next) => {
        sessionMiddleware(socket.request, socket.request.res || {}, next);
    });

    // Reject connections that are not logged in (before, socket.request.session.user.username crashed the server)
    io.use((socket, next) => {
        const username = socket.request.session?.user?.username;
        if (!username) return next(new Error('Not authenticated'));
        socket.data.username = username;
        next();
    });

    io.on('connection', (socket) => {
        const username = socket.data.username;
        addOnlineSocket(username, socket);
        socket.emit('welcome', { username });

        on(socket, 'joinRoom', () => joinQueue(io, socket));

        on(socket, 'cancel_search', () => leaveQueue(socket.id));

        on(socket, 'next_challenge', (payload) => awardSolve(io, socket, payload));

        // The browser's timer reached 0:00. Only accepted when the server agrees time is up.
        on(socket, 'game_over', async () => {
            const roomId = roomOfSocket.get(socket.id);
            const match = matches.get(roomId);
            if (match && Date.now() >= match.endTime - 1000) {
                await finishMatch(io, roomId);
            }
        });

        on(socket, 'disconnect', async () => {
            removeOnlineSocket(username, socket.id);
            leaveQueue(socket.id);
            await handlePlayerLeft(io, socket.id);
        });
    });
}
