// In-memory state shared by the GraphQL resolvers and the Socket.IO game handlers.
// It starts empty whenever the server restarts. That is fine: every socket reconnects after a restart,
// so nobody can get stuck as "already logged in" (the old sessiontoken flag in the database could).

// ---------------------------------------------------------------------------
// Who is online right now: username -> Map(socketId -> socket)
// ---------------------------------------------------------------------------
const socketsByUser = new Map();

export function addOnlineSocket(username, socket) {
  if (!socketsByUser.has(username)) socketsByUser.set(username, new Map());
  socketsByUser.get(username).set(socket.id, socket);
}

export function removeOnlineSocket(username, socketId) {
  const sockets = socketsByUser.get(username);
  if (!sockets) return;
  sockets.delete(socketId);
  if (sockets.size === 0) socketsByUser.delete(username);
}

export function isUserOnline(username) {
  return (socketsByUser.get(username)?.size ?? 0) > 0;
}

// Used on logout so other tabs of the same account stop playing with a dead session.
export function disconnectUserSockets(username) {
  const sockets = socketsByUser.get(username);
  if (!sockets) return;
  for (const socket of sockets.values()) socket.disconnect(true);
}

// ---------------------------------------------------------------------------
// Challenges handed out during a match: username -> { current, served, solved }
// The server only awards points for the challenge it actually gave the player,
// and only after the code runner confirmed every test case passed.
// ---------------------------------------------------------------------------
const challengeProgress = new Map();

function progressFor(username) {
  if (!challengeProgress.has(username)) {
    challengeProgress.set(username, { current: null, served: new Set(), solved: new Set() });
  }
  return challengeProgress.get(username);
}

// Called when a new match starts.
export function resetChallengeProgress(username) {
  challengeProgress.set(username, { current: null, served: new Set(), solved: new Set() });
}

export function getServedChallenges(username) {
  return [...progressFor(username).served];
}

export function clearServedChallenges(username) {
  progressFor(username).served.clear();
}

export function setCurrentChallenge(username, challengeId) {
  const progress = progressFor(username);
  progress.current = challengeId;
  progress.served.add(challengeId);
}

export function recordSolved(username, challengeId) {
  const progress = progressFor(username);
  if (progress.current === challengeId) progress.solved.add(challengeId);
}

// Returns true only once per solved challenge, so the same solution can't be claimed twice.
export function consumeSolved(username, challengeId) {
  const progress = progressFor(username);
  if (!progress.solved.has(challengeId)) return false;
  progress.solved.delete(challengeId);
  if (progress.current === challengeId) progress.current = null;
  return true;
}
