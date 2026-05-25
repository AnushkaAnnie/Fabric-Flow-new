import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

type AuthUser = {
  id: string;
  username: string;
  role: string;
};

@Injectable()
export class AuthService {
  private readonly jwtSecret =
    process.env.JWT_SECRET ?? 'fabric-flow-dev-secret';

  login(username?: string, password?: string) {
    const configuredUser = process.env.AUTH_USERNAME ?? 'admin';
    const configuredPassword = process.env.AUTH_PASSWORD ?? 'admin';

    if (username !== configuredUser || password !== configuredPassword) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const user: AuthUser = {
      id: 'admin',
      username: configuredUser,
      role: 'admin',
    };
    const accessToken = this.sign(user);

    return {
      access_token: accessToken,
      accessToken,
      token: accessToken,
      user,
    };
  }

  verify(token: string): AuthUser {
    const [header, payload, signature] = token.split('.');
    if (!header || !payload || !signature) {
      throw new UnauthorizedException('Invalid token');
    }

    const expected = this.signPart(`${header}.${payload}`);
    const actual = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (
      actual.length !== expectedBuffer.length ||
      !timingSafeEqual(actual, expectedBuffer)
    ) {
      throw new UnauthorizedException('Invalid token');
    }

    const decoded = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    ) as AuthUser & { exp: number };
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('Token expired');
    }

    return {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
    };
  }

  private sign(user: AuthUser) {
    const header = Buffer.from(
      JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
    ).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({
        ...user,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
      }),
    ).toString('base64url');

    return `${header}.${payload}.${this.signPart(`${header}.${payload}`)}`;
  }

  private signPart(value: string) {
    return createHmac('sha256', this.jwtSecret)
      .update(value)
      .digest('base64url');
  }
}
