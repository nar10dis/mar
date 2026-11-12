import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RateLimitInterceptor, RateLimitStore } from './rate-limit.js';

@Global()
@Module({
  providers: [RateLimitStore, { provide: APP_INTERCEPTOR, useClass: RateLimitInterceptor }],
  exports: [RateLimitStore],
})
export class RateLimitModule {}
