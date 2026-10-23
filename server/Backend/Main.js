// Load .env before any other module reads process.env
import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import expressSession from 'express-session';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';
import { Server as SocketIOServer } from 'socket.io';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';

import connectDB from './DB/Connection.js'
import usertypeDefs from './models/user-type-def.js'
import userresolvers from './models/User/user-resolvers.js'
import challenge_typeDefs from './models/challenge-type-def.js'
import challenge_resolvers from './models/Challenges/challenge-resolvers.js'
import match_typeDefs from './models/match-type-def.js'
import matchresolvers from './models/Match/match-resolvers.js'
import { finishStaleMatches } from './models/Match/match-service.js';
import isloggedin from './middleware/isloggedIn.js';
import registerGameSocket from './socket/gameSocket.js';
import { clientOrigins, cookieOptions, requireEnv, SESSION_MAX_AGE_MS, isProduction } from './config.js';

// ✅ What expressMiddleware gives you:
// Single server (httpServer.listen(...)) for GraphQL and Socket.IO
// Shared session/cookie/auth logic

// so when user login so session is stored in server & session id is given to cookie and store in browser, when i open a anther page so cookie sent session to server to confirm the info.
export const typeDefs = mergeTypeDefs([
  usertypeDefs,
  challenge_typeDefs,
  match_typeDefs
]);

export const resolvers = mergeResolvers([
  userresolvers,
  challenge_resolvers,
  matchresolvers
]);

// Fail fast with a clear message if a required secret is missing
const sessionSecret = requireEnv('EXPRESS_SESSION_SECRET');
requireEnv('JWT_KEY');

// Last line of defence: log unexpected async errors instead of letting Node stop the whole server.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

const app = express();

// Render (and most hosts) put the app behind a proxy that handles HTTPS.
// Without this, express-session thinks the connection is plain HTTP and refuses to send the secure session cookie.
app.set('trust proxy', 1);

await connectDB();
await finishStaleMatches();

const httpServer = http.createServer(app);

// Only these frontends may call the API with cookies. Set CLIENT_ORIGINS to change the list.
const corsOptions = {
  origin: clientOrigins,
  credentials: true
};
app.use(cors(corsOptions));

const io = new SocketIOServer(httpServer, {
  cors: corsOptions
});

const sessionMiddleware =
  expressSession({
    secret: sessionSecret,
    resave: false,
    //What it means: "Only save the session if something changed"
    // Better performance (avoids unnecessary saves) and prevents race conditions (multiple writes for same session)

    saveUninitialized: false,
    // What it means: "Don't save empty sessions"
    // Saves storage space, prevents session flooding. It saves only when you modify req.session (e.g., req.session.user = ...)

    store: MongoStore.create({
      client: mongoose.connection.getClient(),
      dbName: 'Game',
      collectionName: 'sessions',
      ttl: SESSION_MAX_AGE_MS / 1000,
    }),
    // Sessions are stored in MongoDB instead of server memory, so users stay logged in when the server restarts
    // (the default MemoryStore lost every session on restart and leaks memory).

    // cookie settings (see config.js → cookieOptions)
    cookie: cookieOptions({ maxAge: SESSION_MAX_AGE_MS }),
    // maxAge: session expires in 1 day.
    // httpOnly: JavaScript in the page can't read the cookie (a script injected by XSS can't steal it).
    // secure + sameSite:
    //   production → secure: true, sameSite: "none". The frontend and backend are on different *.onrender.com
    //                sub-domains, which browsers treat as different sites, so the cookie must be SameSite=None,
    //                and browsers only accept SameSite=None cookies that are also Secure (HTTPS only).
    //   local dev  → secure: false, sameSite: "lax", because http://localhost can't use Secure cookies.
  })

app.use(sessionMiddleware);

// Matchmaking + live game events (reads the same session as the HTTP requests)
registerGameSocket(io, sessionMiddleware);

app.use(express.json({ limit: '100kb' }));
// It lets your server understand JSON in the request body (enable to read data from {req.body})

app.use(express.urlencoded({ extended: true }));
// Lets your server read form data from <form> submissions

app.use(cookieParser())
// 🍪 Lets you read cookies from incoming requests (req.cookies), used for the JWT "token" cookie

// Simple health check (Render pings the service to see if it is up)
app.get('/', (req, res) => {
  res.send('OK');
});

//This attaches your Apollo Server (your GraphQL engine) to your Express app.
// "When a request comes to /graphql, Apollo Server will take over and respond to it."
const apolloserver = new ApolloServer({ typeDefs, resolvers });
await apolloserver.start();

app.use('/graphql', expressMiddleware(apolloserver, {
  context: async ({ req, res }) => {
    // This builds the context object passed to all resolvers.
    // loggedIn is true only when both the session and the JWT cookie belong to the same user.
    return { req, res, loggedIn: isloggedin(req) };
  },
}));


const PORT = process.env.PORT || 1509;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} (${isProduction ? 'production' : 'development'} mode)`);
});
