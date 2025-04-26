import { Module } from '@nestjs/common';
import { PostModule } from './post/post.module';
import { CommentModule } from './comment/comment.module';
import { TagModule } from './tag/tag.module';
import { VoteModule } from './vote/vote.module';
import { PostImageModule } from './post_image/post-image.module';
import { FollowModule } from './follow/follow.module';

@Module({
  imports: [
    PostModule,
    CommentModule,
    TagModule,
    VoteModule,
    PostImageModule,
    FollowModule,
  ],
  exports: [
    PostModule,
    CommentModule,
    TagModule,
    VoteModule,
    PostImageModule,
    FollowModule,
  ],
})
export class SocialModule {}
