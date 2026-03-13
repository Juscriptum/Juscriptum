import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EventsController } from "./controllers/events.controller";
import { EventService } from "./services/event.service";
import { Event } from "../database/entities/Event.entity";
import { User } from "../database/entities/User.entity";
import { NotificationsModule } from "../notifications/notifications.module";

/**
 * Events Module
 */
@Module({
  imports: [TypeOrmModule.forFeature([Event, User]), NotificationsModule],
  controllers: [EventsController],
  providers: [EventService],
  exports: [EventService],
})
export class EventsModule {}
