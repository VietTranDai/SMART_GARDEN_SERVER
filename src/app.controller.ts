import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  
  // Basic health check endpoint
  @Get()
  getHello(): { message: string; timestamp: string; status: number } {
    return {
      message: 'Hello World! API is working perfectly! 🚀',
      timestamp: new Date().toISOString(),
      status: 200
    };
  }
}