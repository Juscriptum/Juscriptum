import { Module, Global } from "@nestjs/common";
import { CdnController } from "./controllers/cdn.controller";
import { CdnService } from "./services/cdn.service";
import { CdnHeadersInterceptor } from "./interceptors/cdn-headers.interceptor";

@Global()
@Module({
  controllers: [CdnController],
  providers: [CdnService, CdnHeadersInterceptor],
  exports: [CdnService, CdnHeadersInterceptor],
})
export class CdnModule {}
