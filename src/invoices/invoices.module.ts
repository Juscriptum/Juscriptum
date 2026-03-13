import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InvoicesController } from "./controllers/invoices.controller";
import { InvoiceService } from "./services/invoice.service";
import { Invoice } from "../database/entities/Invoice.entity";
import { Client } from "../database/entities/Client.entity";
import { FileStorageModule } from "../file-storage/file-storage.module";
import { NotificationsModule } from "../notifications/notifications.module";

/**
 * Invoices Module
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, Client]),
    FileStorageModule,
    NotificationsModule,
  ],
  controllers: [InvoicesController],
  providers: [InvoiceService],
  exports: [InvoiceService],
})
export class InvoicesModule {}
