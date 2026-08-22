import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  createRemoteJWKSet,
  decodeJwt,
  decodeProtectedHeader,
  jwtVerify,
  type JWTPayload,
} from 'jose';

type AuthUser = {
  id: string;
  email?: string;
  role: string;
};

@Injectable()
export class AuthService {
  private readonly supabaseUrl = (
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    ''
  ).replace(/\/+$/, '');

  // Accept tokens whose iss is either the base URL or the /auth/v1 sub-path.
  // Supabase's new publishable-key format uses the base URL as issuer.
  private readonly validIssuers: string[] = this.supabaseUrl
    ? [this.supabaseUrl, `${this.supabaseUrl}/auth/v1`]
    : [];

  private readonly jwtSecret = process.env.SUPABASE_JWT_SECRET;

  // JWKS endpoint — always at /auth/v1/.well-known/jwks.json regardless of
  // which issuer format the token uses.
  private readonly jwks = this.supabaseUrl
    ? createRemoteJWKSet(
        new URL(`${this.supabaseUrl}/auth/v1/.well-known/jwks.json`),
      )
    : null;

  async verify(token: string): Promise<AuthUser> {
    const payload = await this.verifyToken(token);

    const subject = payload.sub;
    if (!subject) {
      throw new UnauthorizedException('Token subject is missing');
    }

    const email = typeof payload.email === 'string' ? payload.email : undefined;
    const appMetadataRole =
      this.isObject(payload.app_metadata) &&
      typeof payload.app_metadata.role === 'string'
        ? payload.app_metadata.role
        : undefined;
    const claimRole =
      typeof payload.role === 'string' ? payload.role : undefined;

    return {
      id: subject,
      email,
      role: appMetadataRole ?? claimRole ?? 'authenticated',
    };
  }

  private async verifyToken(token: string): Promise<JWTPayload> {
    if (!this.supabaseUrl) {
      throw new InternalServerErrorException(
        'SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL must be configured',
      );
    }

    // Decode header to detect algorithm before choosing verification strategy.
    let alg: string | undefined;
    try {
      const header = decodeProtectedHeader(token);
      alg = header.alg;
    } catch {
      throw new UnauthorizedException('Malformed token');
    }

    // Decode claims (unverified) to read the actual issuer so we can match it
    // against our accepted issuers before attempting cryptographic verification.
    let rawPayload: JWTPayload;
    try {
      rawPayload = decodeJwt(token);
    } catch {
      throw new UnauthorizedException('Malformed token payload');
    }

    const tokenIssuer =
      typeof rawPayload.iss === 'string' ? rawPayload.iss : '';
    if (!this.validIssuers.includes(tokenIssuer)) {
      throw new UnauthorizedException(
        `Unexpected token issuer: ${tokenIssuer}`,
      );
    }

    // HS256 path — use the project JWT secret (no network call).
    if (alg?.startsWith('HS') && this.jwtSecret) {
      try {
        const { payload } = await jwtVerify(
          token,
          new TextEncoder().encode(this.jwtSecret),
          { audience: 'authenticated' },
        );
        return payload;
      } catch {
        throw new UnauthorizedException('Invalid or expired token (HS)');
      }
    }

    // ES256 / RS256 path — verify signature via JWKS.
    if (!this.jwks) {
      throw new InternalServerErrorException(
        'JWKS could not be initialised. Ensure SUPABASE_URL is set.',
      );
    }

    try {
      const { payload } = await jwtVerify(
        token,
        this.jwks,
        { audience: 'authenticated' },
        // Note: issuer check is skipped here because we already validated it
        // above via validIssuers to support both URL formats.
      );
      return payload;
    } catch (error) {
      if (
        error instanceof InternalServerErrorException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired Supabase token');
    }
  }

  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
