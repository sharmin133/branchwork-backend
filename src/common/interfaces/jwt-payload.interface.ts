import { Permission } from '../../generated/prisma/client';

export interface JwtPayload {
  sub: string;
  orgId: string;
  isOwner: boolean;
  branchId: string | null;
  permissions: Permission[];
}