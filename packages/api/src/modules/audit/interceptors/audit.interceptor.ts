import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { UserRole } from '@green-pages/prisma';
import { AuditService } from '../audit.service';
import { AUDIT_KEY, AuditMetadata } from '../decorators/audit.decorator';
import { UserPayload } from '../../auth/interfaces';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditMetadata = this.reflector.get<AuditMetadata>(
      AUDIT_KEY,
      context.getHandler(),
    );

    if (!auditMetadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as UserPayload;

    // Only audit admin actions
    if (!user || user.role !== UserRole.ADMIN) {
      return next.handle();
    }

    const entityId = this.extractEntityId(request, auditMetadata);
    const ipAddress = request.ip || request.connection?.remoteAddress;
    const userAgent = request.headers['user-agent'];

    return next.handle().pipe(
      tap({
        next: (result) => {
          this.auditService.log({
            userId: user.id,
            action: auditMetadata.action,
            entityType: auditMetadata.entityType,
            entityId: entityId || 'unknown',
            newValue: this.sanitizeValue(result),
            ipAddress,
            userAgent,
          });
        },
      }),
    );
  }


  private extractEntityId(request: any, metadata: AuditMetadata): string | undefined {
    if (metadata.entityIdParam) {
      return request.params?.[metadata.entityIdParam] || request.body?.[metadata.entityIdParam];
    }
    return request.params?.id || request.body?.id;
  }

  private sanitizeValue(value: any): object | undefined {
    if (!value) return undefined;
    
    // Remove sensitive fields
    const sanitized = { ...value };
    const sensitiveFields = ['password', 'passwordHash', 'token', 'refreshToken', 'accessToken'];
    
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        delete sanitized[field];
      }
    }
    
    return sanitized;
  }
}
