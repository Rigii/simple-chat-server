export const mockMongooseQuery = (returnValue) => ({
  exec: jest.fn().mockResolvedValue(returnValue),
  lean: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
});

export const mockUserProfileModel = {
  create: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  exec: jest.fn(),
};

export const mockChatRoomModel = {
  findOne: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  updateOne: jest.fn(),
  exec: jest.fn(),
  populate: jest.fn(),
};

export const mockRoomMessageModel = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  exec: jest.fn(),
};
