import { Permission } from '../../generated/prisma/client';

export { Permission };

export const PERMISSION_LABELS: Record<Permission, string> = {
  [Permission.MANAGE_STAFF]: 'Manage Staff',
  [Permission.VIEW_PRODUCTS]: 'View Products',
  [Permission.ORGANIZE_PRODUCTS]: 'Organize Products',
};