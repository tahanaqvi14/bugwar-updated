import Authenticator from '../../controllers/Authenticator.js';
import { Check_login_info } from '../../controllers/Check_login_info.js';
import { Adminauth } from '../../controllers/Adminauth.js';
import { getUserModel } from '../../utils/getUserModel.js';
import { requireUser } from '../../utils/auth.js';
import { issueOtp, checkOtp, deleteOtp } from '../../utils/otp.js';
import { destroySession } from '../../utils/session.js';
import { cookieOptions } from '../../config.js';
import { disconnectUserSockets } from '../../game/state.js';
import {
    validate,
    signupSchema,
    displayNameRule,
    usernameRule,
    emailRule,
    passwordRule,
    otpRule
} from '../../utils/validation.js';

// Fields that are safe to send to the browser (never the password hash)
const PUBLIC_FIELDS = 'displayname username points sub_name total_matches email';

const fail = (message) => ({ success: false, message });

const resolvers = {
    Query: {
        LeaderBoard_Info: async (parent, args, context) => {
            requireUser(context);
            const UserModel = getUserModel('Users');
            // Only what the leaderboard needs: no emails, no password hashes
            return UserModel.find({}, 'displayname username points sub_name')
                .sort({ points: -1, displayname: 1 })
                .lean();
        },

        FindUserForProfile: async (parent, args, context) => {
            const username = requireUser(context);
            const UserModel = getUserModel('Users');
            return UserModel.findOne({ username }, PUBLIC_FIELDS).lean();
        },

        Main_menu: async (parent, args, context) => {
            const username = requireUser(context);
            const UserModel = getUserModel('Users');
            return UserModel.findOne({ username }, PUBLIC_FIELDS).lean();
        }
    },

    // total_matches is stored as a list of match ids; the API returns how many there are
    user: {
        total_matches: (user) => user.total_matches?.length ?? 0,
    },

    Mutation: {
        admin_login: async (parent, args, context) => {
            return Adminauth(args.input, context);
        },

        // Sign up step 1: check the details and email a code to the new address
        send_email: async (parent, args) => {
            const emailCheck = validate(emailRule, args.email);
            if (emailCheck.error) return fail(emailCheck.error);
            const usernameCheck = validate(usernameRule, args.username);
            if (usernameCheck.error) return fail(usernameCheck.error);

            const email = emailCheck.value;
            const username = usernameCheck.value;
            const UserModel = getUserModel("Users");

            if (await UserModel.exists({ email })) {
                return fail("Email already exists");
            }
            if (await UserModel.exists({ username })) {
                return fail("Username already exists");
            }

            return issueOtp(email, 'signup');
        },

        // Sign up step 2: create the account only if the emailed code is correct
        user_creation: async (parent, args) => {
            try {
                const { value, error } = validate(signupSchema, args.input);
                if (error) return fail(error);

                const otpResult = await checkOtp(value.email, 'signup', value.otp);
                if (!otpResult.success) return otpResult;

                const UserModel = getUserModel('Users');
                if (await UserModel.exists({ email: value.email })) {
                    return fail("Email already exists");
                }
                if (await UserModel.exists({ username: value.username })) {
                    return fail("Username already exists");
                }

                const user_all_detail = await Authenticator(value.password);
                await UserModel.create({
                    displayname: value.displayname,
                    username: value.username,
                    password: user_all_detail.hash,
                    email: value.email,
                });
                await deleteOtp(value.email, 'signup'); // a code can only create one account

                return {
                    success: true,
                    message: 'User created successfully'
                };
            } catch (error) {
                console.error('user_creation failed:', error);
                return fail('Could not create the account, please try again');
            }
        },

        user_login: async (parent, args, context) => {
            try {
                const UseruserModel = getUserModel('Users');
                const username = String(args.input.username ?? '').trim();
                const is_this_a_user = await UseruserModel.findOne({ username });
                if (!is_this_a_user) {
                    return fail("User not found");
                }
                return await Check_login_info(args.input, context, is_this_a_user);
            } catch (error) {
                console.error('user_login failed:', error);
                return fail('Login failed, please try again');
            }
        },

        // Password reset step 1: email a code to the address saved on the logged-in account
        send_reset_otp: async (parent, args, context) => {
            const username = requireUser(context);
            const user = await getUserModel('Users').findOne({ username }, 'email').lean();
            if (!user?.email) return fail('No email address is saved for this account');
            return issueOtp(user.email, 'reset');
        },

        // Password reset step 2: check the code (it stays valid for the actual change)
        verify_reset_otp: async (parent, args, context) => {
            const username = requireUser(context);
            const otpCheck = validate(otpRule, args.otp);
            if (otpCheck.error) return fail(otpCheck.error);

            const user = await getUserModel('Users').findOne({ username }, 'email').lean();
            return checkOtp(user.email, 'reset', otpCheck.value);
        },

        // Password reset step 3: only the logged-in user, and only with a valid emailed code
        changepwdd: async (parent, args, context) => {
            const username = requireUser(context);
            const otpCheck = validate(otpRule, args.otp);
            if (otpCheck.error) return fail(otpCheck.error);
            const pwdCheck = validate(passwordRule, args.pwd);
            if (pwdCheck.error) return fail(pwdCheck.error);

            try {
                const UserModel = getUserModel("Users");
                const user = await UserModel.findOne({ username });
                if (!user) return fail('User not found');

                const otpResult = await checkOtp(user.email, 'reset', otpCheck.value, { consume: true });
                if (!otpResult.success) return otpResult;

                const pass = await Authenticator(pwdCheck.value);
                user.password = pass.hash;
                await user.save();
            } catch (error) {
                console.error('changepwdd failed:', error);
                return fail('Could not change the password, please try again');
            }
            return {
                success: true,
                message: 'Success'
            };
        },

        logout: async (parent, args, context) => {
            const username = context.req.session?.user?.username;
            try {
                // --- Destroy session ---
                await destroySession(context.req);

                // --- Clear cookies --- (must use the same options they were set with,
                // otherwise the browser ignores the request in production)
                context.res.clearCookie("token", cookieOptions());
                context.res.clearCookie("connect.sid", cookieOptions());

                // --- Close this user's game connections (other tabs too) ---
                if (username) disconnectUserSockets(username);

                return {
                    success: true,
                    message: "Logout successful",
                };
            } catch (error) {
                console.error("❌ Logout error:", error);
                return fail("Logout failed, please try again");
            }
        },

        Update: async (parent, args, context) => {
            const username = requireUser(context);
            const { value, error } = validate(displayNameRule, args.input?.newdisplayname);
            if (error) throw new Error(error);

            const UserModel = getUserModel('Users');
            return UserModel.findOneAndUpdate(
                { username },
                { displayname: value },
                { new: true, projection: PUBLIC_FIELDS }
            ).lean();
        }
    }
};

export default resolvers;
