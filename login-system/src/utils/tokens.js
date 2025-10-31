import crypto from "crypto";

export function sha256Hex(input) {
  return crypto.createHash("sha256").update(String(input)).digest("hex");
}

export function userAgentHash(ua) {
  return sha256Hex(ua || "");
}

export function generateToken(bytes = 32, expireMinutes = 60) {
  const token = crypto.randomBytes(bytes).toString("hex");
  const hash = sha256Hex(token);
  const expiresAt = new Date(Date.now() + expireMinutes * 60 * 1000);
  return { token, hash, expiresAt };
}

export function generateOtp6(expireMinutes = 10) {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const hash = sha256Hex(code);
  const expiresAt = new Date(Date.now() + expireMinutes * 60 * 1000);
  return { code, hash, expiresAt };
}

