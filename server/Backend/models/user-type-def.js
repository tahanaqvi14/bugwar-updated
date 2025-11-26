import { gql } from 'graphql-tag';

const typeDefs = gql`
    type user{
        displayname:String!
        username:ID!
        password:String!
        points:Int
        sub_name:String
        total_matches:Int
        email:String
        sessiontoken:Boolean
    }


    type Match {
        matchId: String!
        players: [user!]!
    }


    type question{
        problem_statement:String!
        function_name:String!
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


    type TestResult {
        input: [String!]!
        expected: String!
        output: String!
        passed: Boolean!
    }

    type RunResult {
        results: [TestResult!]!
        logs: [String!]!
        error: String
    }

    input createuser{
        displayname:String!
        username:ID!
        password:String!
        email:String!
    }

    input loginuser{
        username:ID!
        password:String!
    }

    input updateuser{
        newdisplayname:String!
    }
    
    input inputformatchsaving{
        usernames:String!
    }

    type Mutation{
        user_creation(input:createuser!):CreateUserResponse!
        send_email(email:String,username:String):CreateUserResponse!
        user_login(input:loginuser!):CreateUserResponse!

        changepwdd(username:String,pwd:String):CreateUserResponse!
        Update(input:updateuser):user
        logout:CreateUserResponse!
        
        admin_login(input:loginuser!):CreateUserResponse!


        finduser_and_savematch(input: [inputformatchsaving!]!): Match!

        remove(input: inputformatchsaving):user
        runCode(code: String!): RunResult!
    }
`
export default typeDefs;