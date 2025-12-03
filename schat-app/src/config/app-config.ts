import 'dotenv/config';

export const AppConfig = () => ({
  port: Number(process.env.PORT),
  jwtSecret: process.env.JWT_SECRET,
  mongo_database: {
    uri: process.env.DB_MONGO_URI,
    retryAttempts: 10,
    retryDelay: 5000,
    verboseRetryLog: true,
    onConnectionCreate: (connection) => {
      console.log('Mongo connection created:', connection?.name);
    },
  },
  urls: {
    apiUrl: process.env.API_URL,
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
  },
  encryptionMasterKey: process.env.ENCRYPTION_MASTER_KEY,
});
