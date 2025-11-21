import jwt from 'jsonwebtoken';
// Imports the jsonwebtoken library to verify tokens.
//accessing the user's info from the database



export default async function isloggedin(req) {
    //isloggedin is an Express middleware function.
    // It runs before protected routes (like dashboard, profile, etc.)
    // It checks if the user is logged in by verifying their JWT token.

    if (!req.cookies.token || req.cookies.token === "") {
        // It checks if the user has a token in their cookies OR If there's no token, or it's an empty string, it means the user is not logged in.
        return (false);

    }
    else {
        try {
            let data = jwt.verify(req.cookies.token, process.env.JWT_KEY);
            //this verifies the token in the cookies by the secret key in .env file
            return true;
        } catch (error) {
            return false;
        }
    }
}