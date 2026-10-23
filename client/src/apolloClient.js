import { ApolloClient, InMemoryCache } from '@apollo/client';
import { API_URL } from './config';

export const client = new ApolloClient({
  cache: new InMemoryCache(),
  uri: `${API_URL}/graphql`,
  credentials: 'include', // send the login cookies to the backend
});
