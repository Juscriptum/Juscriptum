import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { EventService } from "../services/event.service";
import {
  CreateEventDto,
  UpdateEventDto,
  EventFiltersDto,
} from "../dto/event.dto";
import { JwtAuthGuard } from "../../auth/guards";
import { TenantGuard, RbacGuard } from "../../auth/guards";
import { Audit } from "../../auth/services/audit.service";
import { Roles } from "../../auth/decorators/access-control.decorators";
import { UserRole } from "../../database/entities/enums/subscription.enum";

/**
 * Events Controller
 */
@ApiTags("Events")
@Controller("events")
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class EventsController {
  constructor(private readonly eventService: EventService) {}

  @Get()
  @ApiOperation({ summary: "Get all events" })
  @ApiResponse({ status: 200, description: "Events retrieved" })
  async findAll(
    @Query() filters: EventFiltersDto,
    @Req() req: any,
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const tenantId = req.user?.tenant_id;
    return this.eventService.findAll(tenantId, filters);
  }

  @Get("statistics")
  @ApiOperation({ summary: "Get event statistics" })
  @ApiResponse({ status: 200, description: "Statistics retrieved" })
  async getStatistics(@Req() req: any): Promise<any> {
    const tenantId = req.user?.tenant_id;
    return this.eventService.getStatistics(tenantId);
  }

  @Get("upcoming")
  @ApiOperation({ summary: "Get upcoming events" })
  @ApiResponse({ status: 200, description: "Upcoming events retrieved" })
  async getUpcoming(
    @Req() req: any,
    @Query("days") days?: string,
  ): Promise<any[]> {
    const tenantId = req.user?.tenant_id;
    return this.eventService.getUpcoming(tenantId, days ? parseInt(days) : 30);
  }

  @Get("calendar")
  @ApiOperation({ summary: "Get calendar events for integration" })
  @ApiResponse({ status: 200, description: "Calendar events retrieved" })
  async getCalendarEvents(
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @Req() req: any,
  ): Promise<any[]> {
    const tenantId = req.user?.tenant_id;
    return this.eventService.getCalendarEvents(
      tenantId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "Get event by ID" })
  @ApiResponse({ status: 200, description: "Event retrieved" })
  async findById(@Param("id") id: string, @Req() req: any): Promise<any> {
    const tenantId = req.user?.tenant_id;
    return this.eventService.findById(tenantId, id);
  }

  @Post()
  @UseGuards(RbacGuard)
  @Roles(
    UserRole.ORGANIZATION_OWNER,
    UserRole.ORGANIZATION_ADMIN,
    UserRole.LAWYER,
    UserRole.ASSISTANT,
  )
  @ApiOperation({ summary: "Create new event" })
  @ApiResponse({ status: 201, description: "Event created" })
  @Audit("create")
  async create(@Body() dto: CreateEventDto, @Req() req: any): Promise<any> {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.user_id;
    return this.eventService.create(tenantId, userId, dto);
  }

  @Put(":id")
  @UseGuards(RbacGuard)
  @Roles(
    UserRole.ORGANIZATION_OWNER,
    UserRole.ORGANIZATION_ADMIN,
    UserRole.LAWYER,
    UserRole.ASSISTANT,
  )
  @ApiOperation({ summary: "Update event" })
  @ApiResponse({ status: 200, description: "Event updated" })
  @Audit("update")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateEventDto,
    @Req() req: any,
  ): Promise<any> {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.user_id;
    return this.eventService.update(tenantId, id, userId, dto);
  }

  @Delete(":id")
  @UseGuards(RbacGuard)
  @Roles(
    UserRole.ORGANIZATION_OWNER,
    UserRole.ORGANIZATION_ADMIN,
    UserRole.LAWYER,
    UserRole.ASSISTANT,
  )
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete event" })
  @ApiResponse({ status: 204, description: "Event deleted" })
  @Audit("delete")
  async delete(@Param("id") id: string, @Req() req: any): Promise<void> {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.user_id;
    return this.eventService.delete(tenantId, id, userId);
  }
}
