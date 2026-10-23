// The admin flag lives in the server-side session (set by admin_login), so the browser cannot fake it.
// The old version trusted a cookie containing bcrypt("admin:admin"), which anyone could create themselves.
export default function isadminloggedin(req) {
  const adminUntil = req.session?.adminUntil;
  return typeof adminUntil === 'number' && adminUntil > Date.now();
}
