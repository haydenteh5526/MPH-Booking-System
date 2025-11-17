import crypto from "node:crypto";

export function sha256Hex(input) {
  return crypto.createHash("sha256").update(String(input)).digest("hex");
}

export function generateToken(bytes = 32, expireMinutes = 60) {
  const token = crypto.randomBytes(bytes).toString("hex");
  const hash = sha256Hex(token);
  const expiresAt = new Date(Date.now() + expireMinutes * 60 * 1000);
  return { token, hash, expiresAt };
}
