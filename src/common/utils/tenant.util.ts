
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// Check whether branch belongs to this organization
export async function assertBranchInOrg(
  prisma: PrismaService,
  orgId: string,
  branchId: string,
) {
  const branch = await prisma.branch.findFirst({
    where: {
      id: branchId,
      organizationId: orgId,
    },
    select: {
      id: true,
    },
  });

  if (!branch) {
    throw new NotFoundException('Branch not found');
  }

  return branch;
}

// Check whether role belongs to this organization
export async function assertRoleInOrg(
  prisma: PrismaService,
  orgId: string,
  roleId: string,
) {
  const role = await prisma.role.findFirst({
    where: {
      id: roleId,
      organizationId: orgId,
    },
    select: {
      id: true,
      permissions: true,
    },
  });

  if (!role) {
    throw new NotFoundException('Role not found');
  }

  return role;
}
