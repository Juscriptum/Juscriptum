import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from "class-validator";

/**
 * Forgot Password DTO
 */
export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

/**
 * Reset Password DTO
 */
export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: "Password too weak",
  })
  newPassword: string;
}
