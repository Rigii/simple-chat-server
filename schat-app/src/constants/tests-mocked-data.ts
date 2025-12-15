const mockUserId = '507f1f77bcf86cd799439011';
// const mockRoomId = '507f1f77bcf86cd799439022';

export const mockLogger = {
  error: jest.fn(),
  log: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

export const mockExistingUser = {
  _id: { toString: () => mockUserId },
  email: 'existing@example.com',
  nickname: 'existingUser',
  rooms: [],
  role: 'user',
  toObject: jest.fn().mockReturnValue({
    _id: mockUserId,
    email: 'existing@example.com',
    nickname: 'existingUser',
    rooms: [],
    role: 'user',
  }),
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
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  exec: jest.fn(),
};

export const mockMongooseQuery = (returnValue) => ({
  exec: jest.fn().mockResolvedValue(returnValue),
  lean: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
});
