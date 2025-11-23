import Authenticator from '../../controllers/Authenticator.js'; // FIX: correct relative import
import { Check_login_info } from '../../controllers/Check_login_info.js';
import { Adminauth } from '../../controllers/Adminauth.js';
import { getUserModel } from '../../utils/getUserModel.js'; // FIX: correct relative import
import Email from '../../utils/Email.js'; // FIX: correct relative import



const resolvers = {
    Query: {
        LeaderBoard_Info: async (parent, args, context) => {
            if (context.loggedIn == false) {
                throw new Error("Not authenticated");
            }
            const UserModel = getUserModel('Users');
            const users = await UserModel.find().sort({ points: -1 });
            return users;
        },

        FindUserForProfile: async (parent, args, context) => {
            // const { user } = context; // FIX: Use context.user from JWT/session
            // const { req } = context; // FIX: Use context.user from JWT/session
            // const is_user_authenticated = await isloggedin(req); // this is for middle ware

            // if (is_user_authenticated) {
            //     const UserModel = getUserModel('Users');
            //     const user_all_info = await UserModel.findOne({ username: user.username });
            //     return user_all_info;
            // } else {
            //     console.log(is_user_authenticated);
            // }
            if (context.loggedIn == false) {
                throw new Error("Not authenticated");
            }
            const UserModel = getUserModel('Users');
            const user_all_info = await UserModel.findOne({ username: context.req.session.user.username });
            return user_all_info;

        },

        Main_menu: async (parent, args, context) => {
            if (context.loggedIn == false) {
                throw new Error("Not authenticated");
            }
            const UserModel = getUserModel('Users');
            const user_all_info = await UserModel.findOne({ username: context.req.session.user.username }); // FIX: await
            // console.log(user_all_info)
            return user_all_info
        }
    },

    Mutation: {
        admin_login: async (parent, args, context) => {
            console.log(args);
            let fetchinfo = args.input
            const result = await Adminauth(fetchinfo, context);
            return result;

        },
        send_email: async (parent, args, context) => {
            const UserModel = getUserModel("Users");
            const { email, username } = args;

            const emailExists = await UserModel.findOne({ email });
            if (emailExists) {
                return {
                    success: false,
                    message: "Email already exists"
                };
            }

            const usernameExists = await UserModel.findOne({ username });
            if (usernameExists) {
                return {
                    success: false,
                    message: "Username already exists"
                };
            }

            const result = await Email(email);
            return {
                success: true,
                message: result.message
            };
        },

        user_login: async (parent, args, context) => {
            try {
                const UseruserModel = getUserModel('Users');
                const fetchedinfo = args.input;
                const username = fetchedinfo.username;
                let is_this_a_user = await UseruserModel.findOne({ username: username });
                if (is_this_a_user != null) {
                    if (is_this_a_user.sessiontoken == false) {
                        const result = await Check_login_info(fetchedinfo, context, is_this_a_user);
                        // console.log(result)
                        if (result.success == true) {
                            is_this_a_user.sessiontoken = true;
                            await is_this_a_user.save();
                        }
                        return result;
                    }
                    else {
                        return {
                            success: false,
                            message: "User already loggedin"
                        }
                    }
                    // const checking=Check_login_info(fetchedinfo,context,is_this_a_user);
                } else {
                    return {
                        success: false,
                        message: "User not found"
                    }
                }
            } catch (error) {
                return {
                    success: false,
                    message: error
                }
            }


        },



        user_creation: async (parent, args) => {
            try {
                const UserModel = getUserModel('Users');
                const fetchedinfo = args.input;
                const username = fetchedinfo.username;
                const user_all_detail = await Authenticator(fetchedinfo);
                await UserModel.create({
                    displayname: user_all_detail.displayname,
                    username: user_all_detail.username,
                    password: user_all_detail.hash,
                    email:fetchedinfo.email,
                });
                return {
                    success: true,
                    message: 'User created successfully'
                };
            } catch (error) {
                return {
                    success: false,
                    message: `${error.message}`
                }
            }
        },

        logout: async (parent, args, context) => {
            try {
                const UserModel = getUserModel('Users');
                const updatedUser = await UserModel.findOneAndUpdate(
                    { username: context.req.session.user.username },
                    {
                        sessiontoken: false,
                    },
                    { new: true }
                );

                // --- Destroy session ---
                if (context.req.session) {
                    await new Promise((resolve, reject) => {
                        context.req.session.destroy(err => {
                            if (err) {
                                console.error("Error destroying session:", err);
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    });
                }

                // --- Clear JWT cookie ---
                context.res.clearCookie("token", {
                    httpOnly: true,
                    sameSite: "lax",
                    secure: process.env.NODE_ENV === "production", // should be true in production
                });

                // --- Clear username cookie (if you set one) ---
                context.res.clearCookie("username", {
                    sameSite: "lax",
                    secure: process.env.NODE_ENV === "production",
                });

                console.log("✅ User logged out successfully");

                return {
                    success: true,
                    message: "Logout successful",
                };
            } catch (error) {
                console.error("❌ Logout error:", error);
                return {
                    success: false,
                    message: `Logout failed: ${error.message}`,
                };
            }
        },

        remove: async (parent, args, context) => {

            let usernames = args.usernames;
            const UserModel = getUserModel('Users');
            const updatedUser = await UserModel.findOneAndUpdate(
                { username: usernames },
                {
                    sessiontoken: false,
                },
                { new: true }
            );
            return updatedUser;
        },


        Update: async (parent, args, context) => {
            try {
                // const { user } = context;
                // if (!user || !user.username) {
                //     throw new Error('User not authenticated');
                // }

                const UserModel = getUserModel('Users');
                const fetchedinfo = args.input;

                // const After_Auth = await Authenticator({
                //     username: user.username,
                //     displayname: fetchedinfo.newdisplayname,
                //     password: fetchedinfo.newpassword
                // });

                const updatedUser = await UserModel.findOneAndUpdate(
                    { username: context.req.session.user.username },
                    {
                        displayname: fetchedinfo.newdisplayname,
                    },
                    { new: true }
                );

                return updatedUser;
            } catch (error) {
                throw new Error(`Failed to update user: ${error.message}`);
            }
        }
    }
};

export default resolvers;