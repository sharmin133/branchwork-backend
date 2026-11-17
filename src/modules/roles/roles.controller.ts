import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OwnerOnly } from '../../common/decorators/owner-only.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

@ApiTags('Roles')
@ApiBearerAuth('access-token')
@OwnerOnly()
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  // GET AVAILABLE PERMISSIONS
  @Get('permissions')
  @ApiOperation({ summary: 'Get all available permissions' })
  listPermissions() {
    return this.rolesService.listPermissions();
  }

  // CREATE ROLE
  @Post()
  @ApiOperation({ summary: 'Create a new role' })
  create(
    @CurrentUser('orgId') orgId: string,
    @Body() dto: CreateRoleDto,
  ) {
    return this.rolesService.create(orgId, dto);
  }

  // GET ALL ROLES WITH PAGINATION
  @Get()
  @ApiOperation({ summary: 'Get all roles with pagination' })
  findAll(
    @CurrentUser('orgId') orgId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.rolesService.findAll(orgId, paginationDto);
  }

  // GET SINGLE ROLE
  @Get(':id')
  @ApiOperation({ summary: 'Get a single role' })
  findOne(
    @CurrentUser('orgId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.rolesService.findOne(orgId, id);
  }

  // UPDATE ROLE
  @Patch(':id')
  @ApiOperation({ summary: 'Update a role' })
  update(
    @CurrentUser('orgId') orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.rolesService.update(orgId, id, dto);
  }

  // DELETE ROLE
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a role' })
  remove(
    @CurrentUser('orgId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.rolesService.remove(orgId, id);
  }
}