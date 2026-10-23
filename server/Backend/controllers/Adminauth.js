import crypto from 'crypto';
import { regenerateSession, saveSession } from '../utils/session.js';

const ADMIN_SESSION_MS = 30 * 60 * 1000; // admin access lasts 30 minutes

// Compares two strings in constant time so attackers can't guess the password character by character
// from how long the check takes.
function safeEqual(a, b) {
    const hashA = crypto.createHash('sha256').update(String(a)).digest();
    const hashB = crypto.createHash('sha256').update(String(b)).digest();
    return crypto.timingSafeEqual(hashA, hashB);
}

export async function Adminauth(fetchedinfo, context) {
    try {
        const { username, password } = fetchedinfo;

        // Admin credentials come from environment variables (ADMIN_USERNAME / ADMIN_PASSWORD),
        // never from the code, because the repository is public.
        const adminUsername = process.env.ADMIN_USERNAME;
        const adminPassword = process.env.ADMIN_PASSWORD;
        if (!adminUsername || !adminPassword) {
            return {
                success: false,
                message: "Admin login is not configured on the server"
            };
        }

        const validUser = safeEqual(username, adminUsername);
        const validPassword = safeEqual(password, adminPassword);
        if (!validUser || !validPassword) {
            return {
                success: false,
                message: "Invalid admin credentials"
            };
        }

        // New session id on login (prevents session fixation). Keep a player login if there is one.
        const playerUser = context.req.session.user;
        await regenerateSession(context.req);
        if (playerUser) context.req.session.user = playerUser;
        context.req.session.adminUntil = Date.now() + ADMIN_SESSION_MS;
        await saveSession(context.req);

        return {
            success: true,
            message: "You are logged in as admin!"
        };

    } catch (error) {
        console.error('Admin login failed:', error);
        return {
            success: false,
            message: "Admin login failed, please try again"
        };
    }
}
