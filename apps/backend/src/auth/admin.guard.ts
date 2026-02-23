import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const password = request.headers['x-admin-password'];

    if (!password || password !== process.env.ADMIN_PASSWORD) {
      throw new UnauthorizedException('Mot de passe admin invalide');
    }
    return true;
  }
}
