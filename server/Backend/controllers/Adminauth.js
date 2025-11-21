import bcrypt from 'bcrypt';

export async function Adminauth(fetchedinfo, context) {
    try {

        const { username, password } = fetchedinfo;

        // Hardcoded admin check
        if (username === 'admin' && password === 'admin') {

            // Create a string to hash for the cookie
            const cookieData = `${username}:${password}`;

            // Hash it
            const hashedCookie = await bcrypt.hash(cookieData, 10);

            // Set cookie
            context.res.cookie("auth", hashedCookie, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: "lax",
                maxAge: 30 * 60 * 1000 // 30 minutes in milliseconds
            });

            console.log(context);
            return {
                success: true,
                message: "You are logged in as admin!"
            };

        } else {
            return {
                success: false,
                message: "Invalid admin credentials"
            };
        }

    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
}
