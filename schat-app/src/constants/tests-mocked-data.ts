const mockUserId = '507f1f77bcf86cd799439011';
// const mockRoomId = '507f1f77bcf86cd799439022';

export const mockLogger = {
  error: jest.fn(),
  log: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

export const mockExistingUser = {
  _id: 'existing-id',
  email: 'existing@example.com',
  nickname: 'existing',
  rooms: [],
  role: 'user',
  toObject: jest.fn(),
};

export const mockNewUser = {
  _id: { toString: () => mockUserId },
  email: 'new@example.com',
  nickname: 'new',
  rooms: [],
  role: 'user',
  toObject: jest.fn().mockReturnValue({
    _id: { toString: () => mockUserId },
    email: 'new@example.com',
    nickname: 'new',
    rooms: [],
    role: 'user',
  }),
};

export const mockUserProfileModel = {
  create: jest.fn(),
  findOne: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  exec: jest.fn(),
};
