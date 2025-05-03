// src/auth/dto/tokens-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class TokensResponseDto {
  @ApiProperty({ example: 'eyJhbGci…' })
  access_token: string;

  @ApiProperty({ example: 'dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4…' })
  refresh_token: string;
}
