
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

import { Permission } from '../../common/constants/permissions.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { PaginationDto } from '../../common/dto/pagination.dto';

import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { StaffService } from './staff.service';

@ApiTags('Staff')
@ApiBearerAuth('access-token')
@RequirePermissions(Permission.MANAGE_STAFF)
@Controller('staff')
export class StaffController {
  constructor(
    private readonly staffService: StaffService,
  ) {}

  // CREATE STAFF
  @Post()
  @ApiOperation({ summary: 'Create a new staff member' })
  create(
    @CurrentUser() actor: JwtPayload,
    @Body() dto: CreateStaffDto,
  ) {
    return this.staffService.create(actor, dto);
  }

  // GET ALL STAFF WITH PAGINATION
  @Get()
  @ApiOperation({ summary: 'Get all staff with pagination' })
  findAll(
    @CurrentUser() actor: JwtPayload,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.staffService.findAll(actor, paginationDto);
  }

  // GET SINGLE STAFF
  @Get(':id')
  @ApiOperation({ summary: 'Get a single staff member' })
  findOne(
    @CurrentUser() actor: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.staffService.findOne(actor, id);
  }

  // UPDATE STAFF
  @Patch(':id')
  @ApiOperation({ summary: 'Update a staff member' })
  update(
    @CurrentUser() actor: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateStaffDto,
  ) {
    return this.staffService.update(actor, id, dto);
  }

  // DELETE STAFF
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a staff member' })
  remove(
    @CurrentUser() actor: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.staffService.remove(actor, id);
  }
}
