import { ApiProperty } from '@nestjs/swagger';

// src/auth/dto/tokens.dto.ts
export class Tokens {
  access_token: string;
  refresh_token: string;
}

export class AccessTokenDto {
  @ApiProperty({
    description: 'JWT access token, valid for a short period',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;
}
