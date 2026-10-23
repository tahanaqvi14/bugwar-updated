import { gql } from 'graphql-tag';

// Matches are created, scored and finished by the server (see socket/gameSocket.js),
// so there are no GraphQL mutations for them: a browser must not be able to change scores.
const match_typeDefs = gql`
    type Participant {
        username: String!
        points: Int
        displayname:String
    }

    type Match {
        matchId: String!
        participants: [Participant!]!
        winner: String
        matchDate: String
        status:String
        endTime: String
        serverTime: String
    }

    type Query{
        Get_matchinfo(matchId: String!): Match
        # Matches of the logged-in user, newest first
        Get_allmatch: [Match]
    }
`

export default match_typeDefs;
