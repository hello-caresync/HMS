import { SignJWT, jwtVerify } from 'jose';

export type JwtRole = 'DOCTOR' | 'ADMIN';

export type AccessTokenPayload = {
  sub: string;
  email: string;
  role: JwtRole;
  hospitalId?: string;
  fullName: string;
};

const JWT_ISSUER = 'nexora-doctor-app';
const JWT_AUDIENCE = 'nexora-clinical';

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET ?? 'dev-jwt-secret-change-in-production-min-32-chars';
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(payload: AccessTokenPayload, expiresIn = '8h'): Promise<string> {
  return new SignJWT({
    email: payload.email,
    role: payload.role,
    hospitalId: payload.hospitalId,
    fullName: payload.fullName,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret());
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    if (!payload.sub || typeof payload.email !== 'string') return null;
    return {
      sub: payload.sub,
      email: payload.email,
      role: (payload.role as JwtRole) ?? 'DOCTOR',
      hospitalId: typeof payload.hospitalId === 'string' ? payload.hospitalId : undefined,
      fullName: typeof payload.fullName === 'string' ? payload.fullName : 'User',
    };
  } catch {
    return null;
  }
}
