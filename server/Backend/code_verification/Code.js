import { fork } from 'child_process';
import { fileURLToPath } from 'url';

// Sends players' code to judge-worker.js, which runs in a separate process.
// Even if a submission is evil (infinite loop, huge memory use) the game server keeps running:
// the worker enforces time and memory limits, and if it ever hangs or crashes it is killed and restarted.

const WORKER_PATH = fileURLToPath(new URL('./judge-worker.js', import.meta.url));
const JOB_TIMEOUT_MS = 15000; // safety net on top of the worker's own per-test time limit
const MAX_CONCURRENT_JOBS = 4;

let worker = null;
let nextJobId = 1;
let activeJobs = 0;
const pending = new Map(); // job id -> { resolve, timer, child }
const waiting = []; // jobs waiting for a free slot

function failure(message) {
    return { success: false, message: { message } };
}

function startWorker() {
    // isolated-vm needs --no-node-snapshot on Node 20+
    const child = fork(WORKER_PATH, [], {
        execArgv: ['--no-node-snapshot'],
        stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
    });

    child.on('message', ({ id, result }) => {
        const job = pending.get(id);
        if (!job) return;
        pending.delete(id);
        clearTimeout(job.timer);
        job.resolve(result);
    });

    child.on('exit', () => {
        if (worker === child) worker = null;
        for (const [id, job] of pending) {
            if (job.child !== child) continue;
            pending.delete(id);
            clearTimeout(job.timer);
            job.resolve(failure(job.timedOut
                ? 'Time limit exceeded. Check for infinite loops.'
                : 'The code runner restarted, please run your code again'));
        }
    });

    child.on('error', (error) => console.error('Code runner process error:', error));
    return child;
}

function runJob(payload) {
    return new Promise((resolve) => {
        if (!worker) worker = startWorker();
        const child = worker;
        const id = nextJobId++;

        const job = { resolve, child, timedOut: false };
        job.timer = setTimeout(() => {
            job.timedOut = true;
            child.kill('SIGKILL'); // the exit handler answers every job of this worker
        }, JOB_TIMEOUT_MS);
        pending.set(id, job);

        child.send({ id, ...payload });
    });
}

async function withSlot(task) {
    if (activeJobs >= MAX_CONCURRENT_JOBS) {
        await new Promise((resolve) => waiting.push(resolve));
    }
    activeJobs++;
    try {
        return await task();
    } finally {
        activeJobs--;
        waiting.shift()?.();
    }
}

const Code = async (userCode, challengeinfo) => {
    return withSlot(() => runJob({
        code: userCode,
        functionName: challengeinfo.function_name,
        inputType: challengeinfo.input_type ?? 'numbers',
        testcases: (challengeinfo.testcases ?? []).map((tc) => ({ case: [...tc.case], expected: tc.expected })),
    }));
};

export default Code;
