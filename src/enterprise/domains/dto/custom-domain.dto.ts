import { IsString, IsNotEmpty, MaxLength, Matches } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AddDomainDto {
  @ApiProperty({ example: "lawyer.example.com" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9-_.]*[a-zA-Z0-9]$/, {
    message: "Invalid domain format",
  })
  domain: string;
}

export class VerifyDomainDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  domainId: string;
}
