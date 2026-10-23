import { GraphQLError } from 'graphql';
import isadminloggedin from '../middleware/isadminloggedin.js';

function notAuthenticated() {
  // The frontend looks for this exact text to redirect to the login page.
  return new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
}

// Returns the logged-in username or throws "Not authenticated".
// Always use this instead of trusting a username sent by the browser.
export function requireUser(context) {
  if (!context.loggedIn) throw notAuthenticated();
  return context.req.session.user.username;
}

export function requireAdmin(context) {
  if (!isadminloggedin(context.req)) throw notAuthenticated();
}
