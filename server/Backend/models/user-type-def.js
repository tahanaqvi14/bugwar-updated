import { gql } from 'graphql-tag';

// Note: there is deliberately no "password" field here. Anything listed in a GraphQL type can be
// requested by any client, so exposing it would leak every user's password hash.
const typeDefs = gql`
    type user{
        displayname:String!
        username:ID!
        points:Int
        sub_name:String
        total_matches:Int
        email:String
    }

    type Query {
        LeaderBoard_Info: [user!]!
        FindUserForProfile:user
        Main_menu:user
    }

    type CreateUserResponse {
        success: Boolean!
        message: String!
    }

    input createuser{
        displayname:String!
        username:ID!
        password:String!
        email:String!
        otp:String!
    }

    input loginuser{
        username:ID!
        password:String!
    }

    input updateuser{
        newdisplayname:String!
    }

    type Mutation{
        # Sign up: emails a code to a new address. The code is never sent back in the response.
        send_email(email:String!,username:String!):CreateUserResponse!
        user_creation(input:createuser!):CreateUserResponse!
        user_login(input:loginuser!):CreateUserResponse!

        # Password reset for the logged-in user: code goes to the email saved on the account.
        send_reset_otp:CreateUserResponse!
        verify_reset_otp(otp:String!):CreateUserResponse!
        changepwdd(otp:String!,pwd:String!):CreateUserResponse!

        Update(input:updateuser!):user
        logout:CreateUserResponse!

        admin_login(input:loginuser!):CreateUserResponse!
    }
`
export default typeDefs;
