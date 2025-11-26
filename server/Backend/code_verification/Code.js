import { NodeVM } from 'vm2';
import vm from 'vm';

const Code = async (userCode, challengeinfo) => {
    console.log('challengeinfo',challengeinfo)

    // Step 1: Pre-validate syntax with vm  class
    try {
        new vm.Script(userCode);
    } catch (syntaxError) {
        console.log('Syntax error caught:', syntaxError);
        return {
            success: false,
            message: {
                message: `Syntax Error: ${syntaxError.message}`,
            },
        };
    }


    const vmInstance = new NodeVM({
        console: 'redirect',
        timeout: 2000,
        sandbox: {},
        require: {
            external: false,
            builtin: [],
        },
    });

    let logs = [];
    vmInstance.on('console.log', (msg) => logs.push(msg));

    let results = [];
    let overallPassed = true;


    try {
        // Ensure the user code exports the function
        const userFunction = vmInstance.run(`
            ${userCode}
            module.exports = ${challengeinfo.function_name};
        `);

        // Execute test cases
        // const results = testCases.map((tc) => {
        //     const output = userFunction(...tc.input);
        //     return {
        //         input: tc.input,
        //         expected: tc.expected,
        //         output,
        //         passed: output === tc.expected,
        //     };
        // });

        // Execute test cases
        
        for (const tc of challengeinfo.testcases) {
            let output, passed, error = null;
            output = userFunction(...tc.case);
            if (output === tc.expected) {
                passed = true;
            } else {
                passed = false;
                output = null;
                passed = false;
            }
            results.push({
                case: tc.case,
                expected: tc.expected,
                output: output === undefined ? null : output,
                passed,
                error,
            });
        }



        let pass = 0;
        for (let element of results) {
            if (element.passed == true) {
                pass += 1;
            }
        }
        if (pass == 2) {
            return {
                success: true,
                message: {
                    input: results[0].case,
                    expected: results[0].expected,
                    output: results[0].output,
                    passed: true,
                    results,
                    // message: "Output did match expected",
                    ...(logs.length > 0 && { consolelogs: logs.map(item => item) })
                }
            }

        } else {
            return {
                success: true,
                message: {
                    results,
                    input: results[0].case,
                    expected: results[0].expected,
                    output: results[0].output,
                    passed: false,
                    // message: "Output did not match expected",
                    ...(logs.length > 0 && { consolelogs: logs.map(item => item) })
                }
            };
        }
    } catch (error) {
        // Handle runtime errors, reference errors, etc.
        return {
            success: false,
            message: {
                message: `Runtime Error: ${error.message}`
            },
        };
    }
};

export default Code;