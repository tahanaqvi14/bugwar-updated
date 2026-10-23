import crypto from 'crypto';
import { getUserModel } from './getUserModel.js';
import Email from './Email.js';
import { requireEnv } from '../config.js';

const OTP_TTL_MS = 10 * 60 * 1000; // a code is valid for 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // at most one email per minute per address (stops email spam)
const MAX_ATTEMPTS = 5; // wrong guesses allowed before a new code is needed

function hashCode(email, purpose, code) {
    return crypto
        .createHmac('sha256', requireEnv('EXPRESS_SESSION_SECRET'))
        .update(`${purpose}:${email}:${code}`)
        .digest('hex');
}

function sameHash(a, b) {
    const bufA = Buffer.from(a, 'hex');
    const bufB = Buffer.from(b, 'hex');
    return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

// Creates a new code, stores its hash and emails it. The code itself is NEVER returned to the browser,
// otherwise anyone could read it from the network response and skip the email check.
export async function issueOtp(email, purpose) {
    const OtpModel = getUserModel('Otps');

    const existing = await OtpModel.findOne({ email, purpose });
    if (existing && Date.now() - existing.createdAt.getTime() < RESEND_COOLDOWN_MS) {
        return {
            success: false,
            message: 'Please wait a minute before requesting another OTP'
        };
    }

    const code = crypto.randomInt(100000, 1000000).toString();
    await OtpModel.findOneAndUpdate(
        { email, purpose },
        {
            codeHash: hashCode(email, purpose, code),
            attempts: 0,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + OTP_TTL_MS)
        },
        { upsert: true, setDefaultsOnInsert: true }
    );

    const sent = await Email(email, code);
    if (!sent.success) {
        await OtpModel.deleteOne({ email, purpose });
        return {
            success: false,
            message: 'Could not send the OTP email, please try again later'
        };
    }

    return {
        success: true,
        message: 'OTP sent to your email'
    };
}

// Checks a code. With consume: true the code is deleted after a successful check so it can't be reused.
export async function checkOtp(email, purpose, code, { consume = false } = {}) {
    const OtpModel = getUserModel('Otps');
    const record = await OtpModel.findOne({ email, purpose });

    if (!record || record.expiresAt.getTime() < Date.now()) {
        return { success: false, message: 'OTP expired, please request a new one' };
    }
    if (record.attempts >= MAX_ATTEMPTS) {
        return { success: false, message: 'Too many wrong attempts, please request a new OTP' };
    }
    if (!sameHash(record.codeHash, hashCode(email, purpose, String(code)))) {
        await OtpModel.updateOne({ _id: record._id }, { $inc: { attempts: 1 } });
        return { success: false, message: 'Wrong OTP' };
    }

    if (consume) await OtpModel.deleteOne({ _id: record._id });
    return { success: true, message: 'OTP verified' };
}

export async function deleteOtp(email, purpose) {
    await getUserModel('Otps').deleteOne({ email, purpose });
}
