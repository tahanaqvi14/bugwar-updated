import jwt from 'jsonwebtoken';
// Imports the jsonwebtoken library to verify tokens.

export default function isloggedin(req) {
    // It checks if the user is logged in before protected resolvers run (profile, leaderboard, game, etc.)
    // The user counts as logged in only when BOTH of these agree:
    //  1. the server-side session has a user (req.session.user, saved at login)
    //  2. the JWT cookie is valid and belongs to that same user
    // Resolvers read the username from the session, so checking only the JWT is not enough:
    // after the session expires the resolvers would crash with "Cannot read properties of undefined".

    const sessionUsername = req.session?.user?.username;
    const token = req.cookies?.token;

    if (!sessionUsername || !token) {
        return false;
    }

    try {
        const data = jwt.verify(token, process.env.JWT_KEY);
        //this verifies the token in the cookies by the secret key in .env file (and that it has not expired)
        return data.username === sessionUsername;
    } catch {
        return false;
    }
}
