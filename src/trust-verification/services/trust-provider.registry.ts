import { Injectable } from "@nestjs/common";
import { TrustProviderType } from "../../database/entities/UserIdentity.entity";
import {
  AcskTrustProviderAdapter,
  BankIdNbuTrustProviderAdapter,
  DiiaTrustProviderAdapter,
  ManualTrustProviderAdapter,
  TrustProviderAdapter,
} from "./trust-provider.adapters";

@Injectable()
export class TrustProviderRegistry {
  private readonly providers: Map<TrustProviderType, TrustProviderAdapter>;

  constructor(
    acskAdapter: AcskTrustProviderAdapter,
    diiaAdapter: DiiaTrustProviderAdapter,
    bankIdAdapter: BankIdNbuTrustProviderAdapter,
    manualAdapter: ManualTrustProviderAdapter,
  ) {
    this.providers = new Map<TrustProviderType, TrustProviderAdapter>([
      [acskAdapter.provider, acskAdapter],
      [diiaAdapter.provider, diiaAdapter],
      [bankIdAdapter.provider, bankIdAdapter],
      [manualAdapter.provider, manualAdapter],
    ]);
  }

  getProvider(provider: TrustProviderType): TrustProviderAdapter {
    const adapter = this.providers.get(provider);
    if (!adapter) {
      throw new Error(`Unsupported trust provider: ${provider}`);
    }

    return adapter;
  }
}
