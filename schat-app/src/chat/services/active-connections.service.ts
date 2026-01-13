import { Injectable, Logger } from '@nestjs/common';
import { strings } from '../strings';

@Injectable()
export class ActiveConnectionsService {
  private userConnections = new Map<string, Set<string>>();
  private roomParticipants = new Map<string, Set<string>>();

  private readonly logger = new Logger(ActiveConnectionsService.name);

  addUserConnection({
    userId,
    clientId,
    nickname,
  }: {
    userId: string;
    clientId: string;
    nickname?: string;
  }): void {
    this.logger.log(`${nickname || userId} ${strings.isActive}`);

    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }

    this.userConnections.get(userId)!.add(clientId);
  }

  removeUserConnection({
    userId,
    clientId,
  }: {
    userId: string;
    clientId: string;
  }): void {
    const userClients = this.userConnections.get(userId);
    if (userClients) {
      userClients.delete(clientId);

      if (userClients.size === 0) {
        this.userConnections.delete(userId);
      }
    }
  }

  getUserConnections(userId: string): Set<string> {
    return new Set(this.userConnections.get(userId) || []);
  }

  isUserConnected(userId: string): boolean {
    const connections = this.userConnections.get(userId);
    return !!connections && connections.size > 0;
  }

  /* Room Management */
  addUserToRoom({
    roomId,
    userId,
  }: {
    roomId: string;
    userId: string;
  }): boolean {
    if (!this.roomParticipants.has(roomId)) {
      this.roomParticipants.set(roomId, new Set());
    }

    const roomUsers = this.roomParticipants.get(roomId)!;
    if (roomUsers.has(userId)) {
      return false;
    }

    roomUsers.add(userId);
    return true;
  }

  removeUserFromRoom(roomId: string, userId: string): void {
    this.roomParticipants.get(roomId)?.delete(userId);
  }

  getRoomParticipants(roomId: string): Set<string> {
    return new Set(this.roomParticipants.get(roomId) || []);
  }

  removeUserFromAllRooms(userId: string): void {
    for (const roomUsers of this.roomParticipants.values()) {
      roomUsers.delete(userId);
    }
  }

  /* Combined Operations */
  disconnectUser(userId: string): void {
    this.userConnections.delete(userId);
    this.removeUserFromAllRooms(userId);
  }

  disconnectClient(clientId: string): string | null {
    let foundUserId: string | null = null;

    for (const [userId, clients] of this.userConnections.entries()) {
      if (clients.has(clientId)) {
        foundUserId = userId;
        break;
      }
    }

    if (foundUserId) {
      this.removeUserConnection({ userId: foundUserId, clientId });

      if (!this.isUserConnected(foundUserId)) {
        this.removeUserFromAllRooms(foundUserId);
      }
    }

    return foundUserId;
  }

  /* Utility Methods (matching your original API) */
  getAllParticipantsInRoom(roomId: string): Set<string> {
    return this.getRoomParticipants(roomId);
  }

  addClientToUserConnection(
    userId: string,
    clientId: string,
    nickname?: string,
  ): void {
    this.addUserConnection({ userId, clientId, nickname });
  }

  removeClientFromUserConnection(userId: string, clientId: string): void {
    this.removeUserConnection({ userId, clientId });
  }

  isUserInRoom(roomId: string, userId: string): boolean {
    return this.roomParticipants.get(roomId)?.has(userId) || false;
  }

  getConnectedUsersInRoom(roomId: string): string[] {
    const participants = this.getRoomParticipants(roomId);
    const connectedUsers: string[] = [];

    for (const userId of participants) {
      if (this.isUserConnected(userId)) {
        connectedUsers.push(userId);
      }
    }

    return connectedUsers;
  }

  getAllGeneralConnections() {
    return new Map(this.userConnections);
  }

  getAllRoomConnections() {
    return new Map(this.roomParticipants);
  }
}
