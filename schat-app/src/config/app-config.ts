import { Logger } from '@nestjs/common';
import 'dotenv/config';

export const AppConfig = () => ({
  port: Number(process.env.APP_PORT),
  mongo_database: {
    uri: process.env.DB_MONGO_URI,
    retryAttempts: 10,
    retryDelay: 5000,
    verboseRetryLog: true,
    onConnectionCreate: (connection) => {
      Logger.log('Mongo connection created:', connection?.name);
    },
  },
  urls: {
    apiUrl: process.env.API_URL,
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
  encryptionMasterKey: process.env.ENCRYPTION_MASTER_KEY,
});
