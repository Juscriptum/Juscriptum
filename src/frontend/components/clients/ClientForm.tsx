import React from "react";
import { FormProvider, UseFormReturn } from "react-hook-form";
import { CreateClientFormData } from "../../schemas/client.schema";
import { ClientType } from "../../types/client.types";
import { ClientFormSections } from "./ClientFormSections";

interface ClientFormProps {
  methods: UseFormReturn<CreateClientFormData>;
  clientType: ClientType;
  onSubmit: (data: CreateClientFormData) => void;
  onTypeChange?: (type: ClientType) => void;
  allowTypeChange?: boolean;
  clientNumberReadOnly?: boolean;
  registrationDateReadOnly?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const ClientForm: React.FC<ClientFormProps> = ({
  methods,
  clientType,
  onSubmit,
  onTypeChange,
  allowTypeChange = true,
  clientNumberReadOnly = false,
  registrationDateReadOnly = false,
  header,
  footer,
}) => (
  <FormProvider {...methods}>
    <form onSubmit={methods.handleSubmit(onSubmit)}>
      {header}
      <ClientFormSections
        methods={methods}
        clientType={clientType}
        onTypeChange={onTypeChange}
        allowTypeChange={allowTypeChange}
        clientNumberReadOnly={clientNumberReadOnly}
        registrationDateReadOnly={registrationDateReadOnly}
      />
      {footer}
    </form>
  </FormProvider>
);
