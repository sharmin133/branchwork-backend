
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

import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OwnerOnly } from '../../common/decorators/owner-only.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';


@ApiTags('Branches')
@ApiBearerAuth('access-token')
@OwnerOnly()
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new branch' })
  create(
    @CurrentUser('orgId') orgId: string,
    @Body() dto: CreateBranchDto,
  ) {
    return this.branchesService.create(orgId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all branches with pagination' })
  findAll(
    @CurrentUser('orgId') orgId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.branchesService.findAll(orgId, paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single branch' })
  findOne(
    @CurrentUser('orgId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.branchesService.findOne(orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a branch' })
  update(
    @CurrentUser('orgId') orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBranchDto,
  ) {
    return this.branchesService.update(orgId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a branch' })
  remove(
    @CurrentUser('orgId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.branchesService.remove(orgId, id);
  }
}
