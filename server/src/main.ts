import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS 활성화 — 모바일 앱에서 API 호출 허용
  app.enableCors();

  // 전역 ValidationPipe - 유효성 검증 실패 시 400 에러로 필드별 에러 메시지 반환
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 전역 인터셉터 - 성공 응답을 { success: true, data } 로 래핑
  app.useGlobalInterceptors(new ResponseInterceptor());

  // 전역 필터 - 에러 응답을 { success: false, error } 로 통일
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('말하기 듣기 쓰기 API')
    .setDescription('쓰기 평가 학습 앱 백엔드 API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(process.env.PORT ?? process.env.API_PORT ?? 3000);
}
void bootstrap();
