import { Injectable, OnModuleInit } from '@nestjs/common';
import { MOCKED_CHAT_ROOMS } from '../constants/chat.mocked';
import { ChatRoom, ChatRoomDocument } from '../schemas/chat-room.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Namespace, Socket } from 'socket.io';
import { chatRoomEmitEvents } from '../constants/chat.events';
import { strings } from '../strings';
import { UserProfile } from 'src/user/schemas/user.schema';
import { ChatDetailsService } from './chat-details.service';
import { ActiveConnectionsService } from './active-connections.service';

@Injectable()
export class ChatService implements OnModuleInit {
  constructor(
    @InjectModel(ChatRoom.name) private chatRoomModel: Model<ChatRoomDocument>,
    @InjectModel(UserProfile.name) private userProfileModel: Model<UserProfile>,
    private readonly chatDetailsService: ChatDetailsService,
    private readonly activeConnectionsService: ActiveConnectionsService,
  ) {}

  private async createDefaultChatRoomDBRecords() {
    try {
      const existingRooms = await this.chatRoomModel
        .find()
        .populate('participants')
        .lean()
        .exec();

      if (existingRooms.length) {
        for (const room of existingRooms) {
          await this.chatDetailsService.storeChatRoomWithCache(room);
        }
        return;
      }

      MOCKED_CHAT_ROOMS.map((room) => {
        return this.chatRoomModel.create({ chat_name: room.chat_name });
      });
      return;
    } catch (error) {
      console.error('Error initializing chat rooms:', error);
    }
  }

  async onModuleInit() {
    this.createDefaultChatRoomDBRecords();
  }

  getCurrentUserAccountData = async (userId: string) => {
    return await this.userProfileModel.findById(userId).exec();
  };

  /* Add clientId (device id) to the participiant set */
  async addIdToExistingInterlocutorConnection({
    clientId,
    userId,
    nickname,
  }: {
    clientId: string;
    userId: string;
    nickname: string;
  }) {
    console.log(`User ${nickname} ${clientId} is active.`);
    this.activeConnectionsService.addNewClientIdToParticipiantPoolConnection({
      userId,
      clientId,
    });
  }

  handleJoinUserRooms = async ({
    client,
    userId,
    nickname,
    io,
  }: {
    client: Socket;
    userId: string;
    nickname: string;
    io: Namespace;
  }) => {
    try {
      /* TODO:// AllChatRooms for the testing purposes. Will be only users rooms */
      const userChatRooms =
        await this.chatDetailsService.getAllChatRoomsFromCache();

      for (const room of userChatRooms) {
        /* Adding Room Id to the active connections pool */
        this.activeConnectionsService.addRoomToGeneralPool(room._id);

        await this.handleJoinChat({
          client,
          room,
          dto: { userId },
        });

        io.to(room._id.toString()).emit(chatRoomEmitEvents.USER_JOINED_CHAT, {
          message: strings.joinChatSuccess
            .replace('${chatName}', room.chat_name)
            .replace('${userNickname}', nickname),
          data: {
            roomId: room._id.toString(),
            roomName: room.chat_name,
            userId,
            nickname,
          },
        });

        console.log(`User ${nickname} joined room: ${room._id.toString()}`);
      }
    } catch (error) {
      client.emit(chatRoomEmitEvents.JOIN_CHAT_ERROR, {
        message: error.message,
      });
    }
  };

  async handleJoinChat({
    client,
    room,
    dto,
  }: {
    client: Socket;
    room: ChatRoom;
    dto: { userId: string };
  }) {
    try {
      /* Join Participant to the room */
      client.join([room._id]);

      /* Adding User Id to the Room Active Interlocutors pull */
      this.activeConnectionsService.addParticipantToRoomConnection(
        room._id,
        dto.userId,
      );
    } catch (error) {
      console.error(strings.joinChatError, error);
      client.emit(chatRoomEmitEvents.JOIN_CHAT_ERROR, {
        message: error.message,
      });
    }
  }

  async disconnectInterlocutor({
    client,
    userId,
    nickname,
    io,
  }: {
    client: Socket;
    userId: string;
    nickname: string;
    io: Namespace;
  }) {
    try {
      this.activeConnectionsService.removeParticipantNestedConnection(
        userId,
        client.id,
      );

      const connectionsPerParticipant =
        this.activeConnectionsService.getAllParticipantsPoolConnection(userId);

      if (connectionsPerParticipant.size === 0) {
        this.activeConnectionsService.deleteUserGeneralConnection(userId);

        console.log(
          strings.userHasNoMoreActiveConnections
            .replace('${nickname}', nickname)
            .replace('${userId}', userId),
        );
      } else {
        console.log(
          strings.userHasOtherActiveConnections
            .replace('${nickname}', nickname)
            .replace('${userId}', userId)
            .replace(
              '${connectionsCount}',
              connectionsPerParticipant.size.toString(),
            ),
        );
      }
      /* Deleeting participant id from the rooms */
      const chatRooms =
        await this.chatDetailsService.getAllChatRoomsFromCache();
      for (const room of chatRooms) {
        /* Emitting Participiant Leave Room message  */
        io.to(room._id.toString()).emit(
          chatRoomEmitEvents.PARTICIPANT_DISCONNECTED,
          {
            message: strings.disconnectChatSuccess
              .replace('${chatName}', room.chat_name)
              .replace('${userNickname}', nickname),
            data: { roomId: room._id.toString(), userId, nickname },
          },
        );

        /* Removing User Id from the Chat Room Online Interlocutors pull */
        this.activeConnectionsService.removeParticipantRoomConnection(
          room._id,
          userId,
        );

        console.log(`User ${nickname} left room: ${room._id.toString()}`);
      }
    } catch (error) {
      console.error(strings.userDisconnectingError, error);
    }
  }

  async userLeftChat({
    client,
    userId,
    nickname,
    io,
  }: {
    client: Socket;
    userId: string;
    nickname: string;
    io: Namespace;
  }) {
    const chatRooms = await this.chatDetailsService.getAllChatRoomsFromCache();

    for (const room of chatRooms) {
      await client.leave(room._id.toString());

      /* Unbind User profile record with chat record */
      await this.chatRoomModel.findByIdAndUpdate(
        room._id.toString(),
        { $pull: { participants: userId } },
        { new: true },
      );

      io.to(room._id.toString()).emit(chatRoomEmitEvents.USER_LEFT_CHAT, {
        message: strings.leaveChatSuccess
          .replace('${chatName}', room.chat_name)
          .replace('${userNickname}', nickname),
        data: { roomId: room._id.toString(), userId, nickname },
      });

      console.log(`User ${nickname} left room: ${room._id.toString()}`);
    }
  }
}
