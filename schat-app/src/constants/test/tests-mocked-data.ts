import { Types } from 'mongoose';

export const mockUserId = '507f1f77bcf86cd799439011';
export const mockUserId2 = '618f1f77bcf86cd799439033';
export const mockRoomId1 = '507f1f77bcf86cd799439022';

export const mockedParticipant1 = {
  _id: mockUserId,
  email: 'user1@example.com',
  nickname: 'user1',
  rooms: [],
  role: 'user',
};

export const mockedParticipant2 = {
  _id: mockUserId2,
  email: 'user2@example.com',
  nickname: 'user2',
  rooms: [],
  role: 'user',
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

export const mockNewChatRoom = {
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

export const mockRoomMessage = {
  _id: new Types.ObjectId('507f1f77bcf86cd799439011'),

  type: 'text',
  nickname: 'Jacob',
  participantId: 'user-123',
  chatRoomId: 'room-456',
  text: 'Hello world',
  isAdmin: false,
  message: 'Hello world',

  created: new Date('2024-01-01T10:00:00.000Z'),
  updated: new Date('2024-01-01T10:00:00.000Z'),

  toObject: jest.fn().mockReturnValue({
    _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
    type: 'text',
    nickname: 'Jacob',
    participantId: 'user-123',
    chatRoomId: 'room-456',
    text: 'Hello world',
    isAdmin: false,
    message: 'Hello world',
    created: new Date('2024-01-01T10:00:00.000Z'),
    updated: new Date('2024-01-01T10:00:00.000Z'),
  }),

  // get id() {
  //   return this._id.toString();
  // },
};

export const mockChatRoom = {
  _id: mockRoomId1,
  chat_name: 'General Chat',
  participants: [mockedParticipant1, mockedParticipant2],
  created: new Date('2024-01-01T10:00:00.000Z'),
  updated: new Date('2024-01-01T10:00:00.000Z'),
};

export const roomDataResponce = {
  messages: [mockRoomMessage],
  activeParticipants: [mockedParticipant1._id],
  roomData: [mockChatRoom],
};
