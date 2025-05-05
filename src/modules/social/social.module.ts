import { Module } from '@nestjs/common';
import { PostModule } from './post/post.module';
import { CommentModule } from './comment/comment.module';
import { TagModule } from './tag/tag.module';
import { VoteModule } from './vote/vote.module';
import { FollowModule } from './follow/follow.module';

@Module({
  imports: [
    PostModule,
    CommentModule,
    TagModule,
    VoteModule,
    FollowModule,
  ],
  exports: [
    PostModule,
    CommentModule,
    TagModule,
    VoteModule,
    FollowModule,
  ],
})
export class SocialModule {}
