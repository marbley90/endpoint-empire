import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Contracts and Jobs API')
    .setDescription('API for managing contracts, jobs, balances, and administrative tasks')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3001);
  console.log(`🚀 Application is running on: http://localhost:3001`);
  console.log(`📖 Swagger API documentation is available at: http://localhost:3001/api`);
}
bootstrap();
