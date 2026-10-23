import bcrypt from 'bcrypt';
import { generateToken } from '../utils/generateToken.js';
import { cookieOptions, SESSION_MAX_AGE_MS } from '../config.js';
import { isUserOnline } from '../game/state.js';
import { regenerateSession, saveSession } from '../utils/session.js';

export async function Check_login_info(fetchedinfo, context, is_this_a_user) {
    try {
        const result = await bcrypt.compare(fetchedinfo.password, is_this_a_user.password);
        if (!result) {
            return {
                success: false,
                message: "Wrong Password"
            };
        }

        // One account can only play from one place at a time.
        // "Online" means the account has a live game connection right now (tracked in memory),
        // so a crash or restart can never lock a user out like the old sessiontoken flag did.
        // Logging in again from the same browser (same session) is always allowed.
        const sameBrowser = context.req.session?.user?.username === is_this_a_user.username;
        if (isUserOnline(is_this_a_user.username) && !sameBrowser) {
            return {
                success: false,
                message: "User already loggedin"
            };
        }

        // Give the browser a brand new session id at login (prevents session fixation attacks).
        await regenerateSession(context.req);
        context.req.session.user = {
            username: is_this_a_user.username
        };
        // Wait until the session is really stored before answering, otherwise the next request
        // (e.g. the main menu) can arrive before the session exists and look "Not authenticated".
        await saveSession(context.req);

        const token = generateToken(is_this_a_user);
        context.res.cookie("token", token, cookieOptions({ maxAge: SESSION_MAX_AGE_MS }));

        return {
            success: true,
            message: "You are loggedin!"
        };
    }
    catch (error) {
        console.error('Login failed:', error);
        return {
            success: false,
            message: "Login failed, please try again"
        };
    }
}
