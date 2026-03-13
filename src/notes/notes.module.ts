import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Case } from "../database/entities/Case.entity";
import { Client } from "../database/entities/Client.entity";
import { Note } from "../database/entities/Note.entity";
import { User } from "../database/entities/User.entity";
import { NotesController } from "./controllers/notes.controller";
import { NotesService } from "./services/notes.service";

@Module({
  imports: [TypeOrmModule.forFeature([Note, Client, Case, User])],
  controllers: [NotesController],
  providers: [NotesService],
  exports: [NotesService],
})
export class NotesModule {}
