import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { TagService } from './tag.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagDto, TagWithPostCountDto } from './dto/tag.dto';
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('Tags')
@Controller('community/tags')
@ApiBearerAuth()
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tag' })
  @ApiResponse({
    status: 201,
    description: 'Tag created successfully',
    type: TagDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  create(@Body() createTagDto: CreateTagDto): Promise<TagDto> {
    return this.tagService.create(createTagDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all tags' })
  @ApiResponse({
    status: 200,
    description: 'List of tags',
    type: [TagWithPostCountDto],
  })
  findAll(): Promise<TagWithPostCountDto[]> {
    return this.tagService.findAll();
  }

  @Get('popular')
  @Public()
  @ApiOperation({ summary: 'Get popular tags based on post count' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of tags to return',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'List of popular tags',
    type: [TagWithPostCountDto],
  })
  getPopularTags(@Query('limit') limit = '20'): Promise<TagWithPostCountDto[]> {
    return this.tagService.getPopularTags(parseInt(limit, 10));
  }

  @Get('search')
  @Public()
  @ApiOperation({ summary: 'Search tags by name' })
  @ApiQuery({ name: 'query', required: true, description: 'Search query' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of tags to return',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'List of matching tags',
    type: [TagDto],
  })
  searchTags(
    @Query('query') query: string,
    @Query('limit') limit = '10',
  ): Promise<TagDto[]> {
    return this.tagService.searchTags(query, parseInt(limit, 10));
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get tag details by ID' })
  @ApiResponse({
    status: 200,
    description: 'Tag details',
    type: TagWithPostCountDto,
  })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<TagWithPostCountDto> {
    return this.tagService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tag' })
  @ApiResponse({
    status: 200,
    description: 'Tag updated successfully',
    type: TagDto,
  })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTagDto: UpdateTagDto,
  ): Promise<TagDto> {
    return this.tagService.update(id, updateTagDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a tag' })
  @ApiResponse({
    status: 200,
    description: 'Tag deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete tag because it is being used',
  })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.tagService.remove(id);
  }
}
