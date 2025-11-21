import bcrypt from 'bcrypt';

export default async function isadminloggedin(req) {
  try {
    const authCookie = req.cookies?.auth;

    // No cookie found
    if (!authCookie) {
      return false;
    }

    // Compare cookie hash with hardcoded admin credentials
    const isValid = await bcrypt.compare('admin:admin', authCookie);

    return isValid; // true if valid, false if invalid

  } catch (error) {
    console.error("Admin auth check error:", error);
    return false;
  }
}
