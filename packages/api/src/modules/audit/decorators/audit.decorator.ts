import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'audit';

export interface AuditMetadata {
  action: string;
  entityType: string;
  entityIdParam?: string; // Parameter name to extract entity ID from
}

export const Audit = (metadata: AuditMetadata) => SetMetadata(AUDIT_KEY, metadata);
