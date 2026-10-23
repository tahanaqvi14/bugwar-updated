import { gql } from 'graphql-tag';

const challenge_typeDefs = gql`

    type challenge{
        function_name:String
        problem_statement:String
        _id: ID!
        testcases: [testcase]
        difficulty:String
        # numbers | array | array_and_k (how test case numbers are passed to the function)
        input_type:String
    }

    type testcase {
        case: [Int!]!
        expected: Int!
    }


    input checking_code{
        code:String!
        challengeid:ID!
    }

    type TestCaseResult {
        case: [Int!]!
        expected: Int!
        # What the player's function returned, as JSON text (null when it returned nothing)
        output: String
        passed:Boolean!
        error: String
    }

    type TestCase {
        results: [TestCaseResult]
        passed: Boolean
        message: String
        consolelogs: [String]
    }

    type CodeResponse {
        success: Boolean!
        message: TestCase
    }

    input TestCaseInput {
        case: [Int!]!
        expected: Int!
    }

    input ChallengeInput {
        _id: ID
        function_name: String!
        problem_statement: String!
        testcases: [TestCaseInput!]!
        difficulty: String!
        input_type: String
    }

    type Query{
        Get_challenge(idnum:ID):challenge
        checking_user_code(input:checking_code!):CodeResponse!
        Get_challengeall:[challenge]
        check:Boolean
    }

    type Mutation {
        deleteChallenge(id_number: ID!): Boolean!
        updateChallenge(input: ChallengeInput!):challenge
        createChallenge(input: ChallengeInput!):Boolean!
    }
`

export default challenge_typeDefs;
