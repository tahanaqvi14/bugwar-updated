// Runs players' code. This file runs in its own child process (started by Code.js), and every submission
// runs inside a fresh isolated-vm "isolate": a separate V8 engine with no access to Node.js
// (no require, no process, no files, no network), a memory limit and a real time limit.
// vm2, used before, is discontinued and has known sandbox escapes, and its timeout did not work
// for NodeVM, so a single `while(true){}` froze the whole game server.

const TIME_LIMIT_MS = 1000; // per test case
const MEMORY_LIMIT_MB = 32;
const MAX_LOG_LINES = 50;

let ivm = null;
let loadError = null;
try {
    ivm = (await import('isolated-vm')).default;
} catch (error) {
    loadError = error;
    console.error('isolated-vm could not be loaded, code runs will fail:', error.message);
}

// Exit together with the main server.
process.on('disconnect', () => process.exit(0));

process.on('message', async (job) => {
    let result;
    try {
        result = await judge(job);
    } catch (error) {
        result = failure(`Runner error: ${error.message}`);
    }
    process.send({ id: job.id, result });
});

function failure(message) {
    return { success: false, message: { message } };
}

// How the test case numbers are passed to the player's function (see models/challenge.js)
function buildArgs(inputType, numbers) {
    if (inputType === 'array') return [numbers];
    if (inputType === 'array_and_k') return [numbers.slice(0, -1), numbers[numbers.length - 1]];
    return numbers;
}

function friendlyError(error) {
    const text = String(error?.message ?? error);
    if (/timed out/i.test(text)) {
        return `Time limit exceeded (${TIME_LIMIT_MS / 1000} second). Check for infinite loops.`;
    }
    if (/memory limit/i.test(text)) {
        return `Memory limit exceeded (${MEMORY_LIMIT_MB} MB).`;
    }
    return text;
}

// Runs inside the isolate before the player's code: console.log support.
const PRELUDE = `
  const __stringify = JSON.stringify;
  const __toText = (value) => {
    if (typeof value === 'string') return value;
    try { const text = __stringify(value); return text === undefined ? String(value) : text; }
    catch { return String(value); }
  };
  const __logger = (...args) => __log(args.map(__toText).join(' '));
  globalThis.console = { log: __logger, info: __logger, warn: __logger, error: __logger };
`;

// Calls the player's function for one test case. Only primitive return values (numbers, strings, ...)
// come back as-is; objects come back as text, so they can never pretend to equal the expected number.
// The check is written inline (no helper on globalThis) so the player's code has nothing to overwrite.
function testCaseCode(functionName) {
    return `
      const value = ${functionName}(...$0);
      const type = typeof value;
      if (value === null || type === 'number' || type === 'string' || type === 'boolean' || type === 'undefined') {
        return ['value', value];
      }
      let text;
      try { text = String(value); } catch { text = '[object]'; }
      return ['text', text];
    `;
}

// How a returned value is shown to the player
function display(value) {
    if (value === undefined) return null;
    if (typeof value === 'number') return String(value);
    return JSON.stringify(value);
}

async function judge({ code, functionName, inputType, testcases }) {
    if (!ivm) {
        return failure(`The code runner is not available on this server (${loadError?.message ?? 'unknown error'})`);
    }
    if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(functionName ?? '')) {
        return failure('This challenge has an invalid function name');
    }
    if (!Array.isArray(testcases) || testcases.length === 0) {
        return failure('This challenge has no test cases');
    }

    const logs = [];
    let collectLogs = true; // keep the output short: logs from the code itself and the first test case only

    const isolate = new ivm.Isolate({ memoryLimit: MEMORY_LIMIT_MB });
    try {
        const context = await isolate.createContext();
        const jail = context.global;
        await jail.set('global', jail.derefInto());
        await jail.set('__log', new ivm.Callback((line) => {
            if (collectLogs && logs.length < MAX_LOG_LINES) logs.push(String(line).slice(0, 500));
        }));
        await context.eval(PRELUDE);

        // Step 1: compile (syntax errors) and run the top level of the code
        let script;
        try {
            script = await isolate.compileScript(code, { filename: 'solution.js' });
        } catch (syntaxError) {
            return failure(`Syntax Error: ${friendlyError(syntaxError)}`);
        }
        try {
            await script.run(context, { timeout: TIME_LIMIT_MS });
        } catch (error) {
            return failure(`Runtime Error: ${friendlyError(error)}`);
        }

        const fnType = await context.eval(`typeof ${functionName}`, { timeout: TIME_LIMIT_MS });
        if (fnType !== 'function') {
            return failure(`Runtime Error: ${functionName} is not defined. Make sure your code defines function ${functionName}.`);
        }

        // Step 2: run every test case
        const results = [];
        for (const [index, tc] of testcases.entries()) {
            let output = null;
            let passed = false;
            let error = null;

            try {
                const [kind, value] = await context.evalClosure(
                    testCaseCode(functionName),
                    [buildArgs(inputType, tc.case)],
                    { arguments: { copy: true }, result: { copy: true }, timeout: TIME_LIMIT_MS }
                );
                if (kind === 'value') {
                    passed = value === tc.expected;
                    output = display(value);
                } else {
                    output = value;
                }
            } catch (runError) {
                error = friendlyError(runError);
                if (isolate.isDisposed) {
                    return failure(`Runtime Error: ${error}`);
                }
            }

            results.push({ case: tc.case, expected: tc.expected, output, passed, error });
            if (index === 0) collectLogs = false;
        }

        return {
            success: true,
            message: {
                passed: results.every((r) => r.passed),
                results,
                ...(logs.length > 0 && { consolelogs: logs }),
            },
        };
    } finally {
        if (!isolate.isDisposed) isolate.dispose();
    }
}
