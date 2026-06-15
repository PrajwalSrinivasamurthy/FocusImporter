import { SignJWT, jwtVerify } from "jose";

export const SESSION_KEY = "fi_session";
export const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

export interface SessionPayload {
  userId: number;
  email: string;
  permissions: string;
  tokenVersion: number;
}

const secret = () =>
  new TextEncoder().encode(
    process.env.JWT_SECRET ?? "change-me-in-production-min-32-chars!!"
  );

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret());
}

export async function verifySession(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export function getBearerToken(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7);
}
