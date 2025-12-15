import bcrypt from 'bcrypt';
import { generateToken } from '../utils/generateToken.js';

export async function Check_login_info(fetchedinfo, context, is_this_a_user) {
    try {
        const result = await bcrypt.compare(fetchedinfo.password, is_this_a_user.password);
        if (result) {

            try {
                let token = generateToken(is_this_a_user);
                // Use cross-site friendly cookie settings in production so hosted
                // frontend can send the token back.
                const origin = context.req?.headers?.origin || '';
                const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1');
                const isProd = process.env.NODE_ENV === 'production' || !isLocal;
                context.res.cookie("token", token, {
                    httpOnly: true,
                    secure: isProd,           // required for SameSite=None
                    sameSite: isProd ? "none" : "lax"
                });

                context.req.session.user = {
                    username: fetchedinfo.username
                };
                await context.req.session.save(err => {
                    if (err) console.error('Failed to save session:', err);
                    else console.log('Session saved successfully');
                });

                return {
                    success: true,
                    message: "You are loggedin!"
                }

            } catch (error) {
                return {
                    success: false,
                    message: error.message
                };
            }
        }
        else {
            return {
                success: false,
                message: "Wrong Password"
            };
        }
    }
    catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
}