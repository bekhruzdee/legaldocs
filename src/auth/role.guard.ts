import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// ✅ Rollarni belgilash uchun decorator
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    try {
      const request = context.switchToHttp().getRequest();
      const user = request.user;

      // ✅ Meta-ma'lumotdan kerakli rollarni olish
      const requiredRoles = this.reflector.get<string[]>(
        'roles',
        context.getHandler(),
      );

      // ✅ Agar rol talab qilinmasa, har kim kira oladi
      if (!requiredRoles || requiredRoles.length === 0) {
        return true;
      }

      // ✅ Agar foydalanuvchi yoki roli bo'lmasa, ruxsat berilmaydi
      if (!user || !user.role) {
        throw new UnauthorizedException(
          'User is not authenticated or role is missing',
        );
      }

      // ✅ Agar foydalanuvchi roli kerakli ro‘llar ichida bo‘lmasa, ruxsat berilmaydi
      if (!requiredRoles.includes(user.role)) {
        throw new UnauthorizedException('You are not allowed');
      }

      return true;
    } catch (error) {
      console.error('RolesGuard error:', error);
      throw new UnauthorizedException(error.message);
    }
  }
}
