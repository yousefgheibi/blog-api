import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class RegisterDto {
    @IsEmail()
    @MaxLength(254)
    email: string;

    @IsString()
    @MinLength(3)
    @MaxLength(128)
    name: string;

    @IsString()
    @MinLength(8)
    @MaxLength(128)
    password: string;
}