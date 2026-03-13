import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Roles } from "../../auth/decorators/access-control.decorators";
import { JwtAuthGuard, RbacGuard, TenantGuard } from "../../auth/guards";
import { Audit } from "../../auth/services/audit.service";
import { UserRole } from "../../database/entities/enums/subscription.enum";
import { CreateNoteDto, NoteFiltersDto, UpdateNoteDto } from "../dto/note.dto";
import { NotesService } from "../services/notes.service";

@ApiTags("Notes")
@Controller("notes")
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  @ApiOperation({ summary: "Get all notes" })
  @ApiResponse({ status: 200, description: "Notes retrieved" })
  async findAll(@Query() filters: NoteFiltersDto, @Req() req: any) {
    return this.notesService.findAll(req.user?.tenant_id, filters, req.user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get note by ID" })
  @ApiResponse({ status: 200, description: "Note retrieved" })
  async findById(@Param("id") id: string, @Req() req: any) {
    return this.notesService.findById(req.user?.tenant_id, id, req.user);
  }

  @Post()
  @UseGuards(RbacGuard)
  @Roles(
    UserRole.ORGANIZATION_OWNER,
    UserRole.ORGANIZATION_ADMIN,
    UserRole.LAWYER,
    UserRole.ASSISTANT,
    UserRole.ACCOUNTANT,
  )
  @ApiOperation({ summary: "Create note" })
  @ApiResponse({ status: 201, description: "Note created" })
  @Audit("create")
  async create(@Body() dto: CreateNoteDto, @Req() req: any) {
    return this.notesService.create(
      req.user?.tenant_id,
      req.user?.user_id,
      dto,
      req.user,
    );
  }

  @Put(":id")
  @UseGuards(RbacGuard)
  @Roles(
    UserRole.ORGANIZATION_OWNER,
    UserRole.ORGANIZATION_ADMIN,
    UserRole.LAWYER,
    UserRole.ASSISTANT,
    UserRole.ACCOUNTANT,
  )
  @ApiOperation({ summary: "Update note" })
  @ApiResponse({ status: 200, description: "Note updated" })
  @Audit("update")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateNoteDto,
    @Req() req: any,
  ) {
    return this.notesService.update(
      req.user?.tenant_id,
      id,
      req.user?.user_id,
      dto,
      req.user,
    );
  }

  @Delete(":id")
  @UseGuards(RbacGuard)
  @Roles(
    UserRole.ORGANIZATION_OWNER,
    UserRole.ORGANIZATION_ADMIN,
    UserRole.LAWYER,
    UserRole.ASSISTANT,
    UserRole.ACCOUNTANT,
  )
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete note" })
  @ApiResponse({ status: 204, description: "Note deleted" })
  @Audit("delete")
  async delete(@Param("id") id: string, @Req() req: any): Promise<void> {
    await this.notesService.delete(
      req.user?.tenant_id,
      id,
      req.user?.user_id,
      req.user,
    );
  }
}
