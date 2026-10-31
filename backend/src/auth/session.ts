import { jwtVerify, SignJWT } from "jose";

const ISSUER = "alap-prostuti";
const AUDIENCE = "alap-prostuti-web";
export const SESSION_TTL_SECONDS = 60 * 60;

export type Session = { userId: number; googleSub: string };

export function createSessionTokens(secret: string) {
  const key = new TextEncoder().encode(secret);

  return {
    async issue(session: Session) {
      const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
      const token = await new SignJWT({ gsub: session.googleSub })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(String(session.userId))
        .setIssuer(ISSUER)
        .setAudience(AUDIENCE)
        .setIssuedAt()
        .setExpirationTime(expiresAt)
        .sign(key);
      return { token, expiresAt };
    },

    // Throws on a bad signature, wrong issuer or audience, or an expired token
    async verify(token: string): Promise<Session> {
      const { payload } = await jwtVerify(token, key, {
        issuer: ISSUER,
        audience: AUDIENCE,
        algorithms: ["HS256"],
      });
      const userId = Number(payload.sub);
      if (!Number.isSafeInteger(userId) || typeof payload.gsub !== "string") {
        throw new Error("Malformed session token");
      }
      return { userId, googleSub: payload.gsub };
    },
  };
}

export type SessionTokens = ReturnType<typeof createSessionTokens>;
