import { OAuth2Client } from "google-auth-library";

// Resolves to Google's stable `sub`, or throws if the token is not valid for us
export type VerifyGoogleIdToken = (idToken: string) => Promise<string>;

// The library checks the signature, audience (our client ID), issuer and expiry
export function createGoogleVerifier(clientId: string): VerifyGoogleIdToken {
  const client = new OAuth2Client(clientId);
  return async (idToken) => {
    const ticket = await client.verifyIdToken({ idToken, audience: clientId });
    const sub = ticket.getPayload()?.sub;
    if (!sub) {
      throw new Error("Google ID token has no sub");
    }
    return sub;
  };
}
