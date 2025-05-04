// src/auth/strategies/jwt-refresh.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, JwtFromRequestFunction, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../dto/jwt-payload.interface';
import { UserService } from '../../users/user/service/user.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    const secret = configService.get<string>('JWT_REFRESH_TOKEN_SECRET');
    if (!secret) throw new Error('Missing JWT_REFRESH_TOKEN_SECRET');

    const extractor: JwtFromRequestFunction = (req: Request) => {
      const auth = req.headers['authorization'];
      if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
        return auth.slice(7).trim();
      }
      return null;
    };

    console.log("secret: ", secret);
    console.log("jwtFromRequest: ", ExtractJwt.fromExtractors([extractor]));


    super({
      jwtFromRequest: ExtractJwt.fromExtractors([extractor]),
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    console.log("req: ", req);

    (req as any).rawRefreshToken =
      ExtractJwt.fromAuthHeaderAsBearerToken()(req);

    console.log("payload: ", payload);

    if (!payload.sub) {
      throw new UnauthorizedException('Invalid refresh token payload');
    }
    const user = await this.userService.findUser(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }
}
