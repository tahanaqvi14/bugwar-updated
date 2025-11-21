import { gql } from 'graphql-tag';

const challenge_typeDefs = gql`

    type challenge{
        function_name:String
        problem_statement:String
        id_number:Int
        testcases: [testcase]
        difficulty:String
    }

    type testcase {
        case: [Int!]!
        expected: Int!
    }

        
    input checking_code{
        code:String!
        challengeid:Int!
    }

    type TestCaseResult {
        case: [Int!]!
        expected: Int!
        output: Int
        passed:Boolean!
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
        id_number:Int
        function_name: String
        problem_statement: String
        testcases: [TestCaseInput]
        difficulty: String
    }

    type Query{
        Get_challenge(idnum:Int):[challenge]
        checking_user_code(input:checking_code!):CodeResponse!
        Get_challengeall:[challenge]
        check:Boolean
    }

    type Mutation {
        deleteChallenge(id_number: Int!): Boolean!
        updateChallenge(input: ChallengeInput):challenge
        createChallenge(input: ChallengeInput):Boolean!
    }
`

export default challenge_typeDefs;