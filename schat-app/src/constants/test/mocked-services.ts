export const mockLoggerService = {
  error: jest.fn(),
  log: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

export const mockRedisService = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

export const mockActiveConnectionsService = {
  addRoomToGeneralPool: jest.fn(),
  removeRoomFromGeneralPool: jest.fn(),
  getActiveUsersInRoom: jest.fn(),
};

export const mockUserService = {
  create: jest.fn(),
  getAccountData: jest.fn(),
};
