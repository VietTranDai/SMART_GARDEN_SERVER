import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateCommentDto } from './create-comment.dto';

// Khi cập nhật chỉ cho phép thay đổi nội dung, không cho thay đổi postId và parentId
export class UpdateCommentDto extends PartialType(
  OmitType(CreateCommentDto, ['postId', 'parentId'] as const),
) {}
