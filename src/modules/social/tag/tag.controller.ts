import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TagService } from './tag.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagDto, TagWithPostCountDto } from './dto/tag.dto';
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('Tags')
@Controller('tags')
@ApiBearerAuth()
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo một tag mới' })
  @ApiResponse({
    status: 201,
    description: 'Tag đã được tạo thành công.',
    type: TagDto,
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  create(@Body() createTagDto: CreateTagDto): Promise<TagDto> {
    return this.tagService.create(createTagDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Lấy danh sách tất cả các tag' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách các tag.',
    type: [TagWithPostCountDto],
  })
  findAll(): Promise<TagWithPostCountDto[]> {
    return this.tagService.findAll();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Lấy thông tin của một tag theo ID' })
  @ApiResponse({
    status: 200,
    description: 'Thông tin chi tiết của tag.',
    type: TagWithPostCountDto,
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy tag.' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<TagWithPostCountDto> {
    return this.tagService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin của một tag' })
  @ApiResponse({
    status: 200,
    description: 'Tag đã được cập nhật thành công.',
    type: TagDto,
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy tag.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTagDto: UpdateTagDto,
  ): Promise<TagDto> {
    return this.tagService.update(id, updateTagDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa một tag' })
  @ApiResponse({
    status: 200,
    description: 'Tag đã được xóa thành công.',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy tag.' })
  @ApiResponse({
    status: 400,
    description: 'Không thể xóa tag vì đang được sử dụng.',
  })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.tagService.remove(id);
  }
}
