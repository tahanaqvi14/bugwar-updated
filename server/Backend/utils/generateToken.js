import jwt from "jsonwebtoken";
// You’re importing the jsonwebtoken library so you can create and use JWTs (JSON Web Tokens).
// This tool helps you make secure user tokens.


export function generateToken(user) {
    // You’re creating a function named generateToken.
    // It takes in a user object after successfull login



    return jwt.sign({ username:user.username,userid: user._id }, process.env.JWT_KEY, { expiresIn: '1d' });
    // You're creating a token using the jsonwebtoken library.
    // This token holds the user's info and is locked with a secret key.
    // expiresIn: '1d' → the token stops working after one day (same as the session), so a stolen token can't be used forever.

    //jwt.sign(...)
    // This means: "Make a token"
    // It's like creating a digital ID card for the user.
    // You give it data to include in the token and a secret to lock it.

    // { username:user.username,userid: user._id }
    //this is the payload, in order words u just say that keep this info in the cookie.
    //in other words: i want this token to represent this user.

    //process.env.JWT_KEY
    //iskay through token bantay hain & verify hotay hain.
    //This is your secret key, stored in the .env file (hidden from the public).
    // It’s used to sign and protect the token.
    // Think of it like a digital seal or signature — so the server can later check:
    // "Did I create this token, or was it faked?"
}