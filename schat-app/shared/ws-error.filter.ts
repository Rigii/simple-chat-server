import {
  Catch,
  WsExceptionFilter,
  ArgumentsHost,
  Logger,
} from '@nestjs/common';

@Catch()
export class WsErrorFilter implements WsExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const client = host.switchToWs().getClient();
    const data = host.switchToWs().getData();

    const errorResponse = {
      code: exception.status || 500,
      timestamp: new Date().toISOString(),
      message: exception.message || 'Internal server error',
      data,
    };

    Logger.error('WS Error', JSON.stringify(errorResponse), 'WsErrorFilter');

    client.emit('error', errorResponse);
  }
}
