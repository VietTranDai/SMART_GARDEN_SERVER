// src/auth/dto/refresh-token.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ example: 'dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4…' })
  refresh_token: string;
}
