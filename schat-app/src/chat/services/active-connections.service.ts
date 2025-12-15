import { Injectable, Logger } from '@nestjs/common';
import { strings } from '../strings';

@Injectable()
export class ActiveConnectionsService {
  private activeConnections = new Map<string, Set<string>>();
  private readonly logger = new Logger(ActiveConnectionsService.name);

  private removeNestedConnection(parentId: string, id: string) {
    this.activeConnections.get(parentId)?.delete(id);
  }

  private addIdToGeneralPool(id: string) {
    if (this.activeConnections.has(id)) {
      return;
    }
    this.activeConnections.set(id, new Set());
  }

  /* Room Pool*/
  addRoomToGeneralPool(id: string) {
    this.addIdToGeneralPool(id);
  }

  removeParticipantRoomConnection(roomId: string, userId: string) {
    this.removeNestedConnection(roomId, userId);
  }

  addParticipantToRoomConnection(roomId: string, userId: string): boolean {
    if (!this.activeConnections.has(roomId)) {
      this.activeConnections.set(roomId, new Set());
    }

    const users = this.activeConnections.get(roomId);

    if (users.has(userId)) {
      return false;
    }

    users.add(userId);
    return true;
  }

  getAllParticipantsInRoomConnection(roomId: string): Set<string> {
    if (!this.activeConnections.has(roomId)) {
      this.activeConnections.set(roomId, new Set());
    }

    return this.activeConnections.get(roomId);
  }

  /* General Connection Pool */
  deleteUserGeneralConnection(id) {
    return this.activeConnections.delete(id);
  }

  isParticipantInGeneralConnectionPool(id: string) {
    return this.activeConnections.has(id) || new Set();
  }

  addParticipiantToGeneralPool(id: string) {
    this.addIdToGeneralPool(id);
  }

  getAllGeneralConnections() {
    return this.activeConnections;
  }

  removeParticipantNestedConnection(participantId: string, clientId: string) {
    this.removeNestedConnection(participantId, clientId);
  }

  addNewClientIdToParticipiantPoolConnection = ({
    userId,
    clientId,
    nickname,
  }: {
    userId: string;
    clientId: string;
    nickname?: string;
  }) => {
    this.logger.log(`${nickname || ''} ${strings.isActive}`);

    if (!this.activeConnections.has(userId)) {
      this.activeConnections.set(userId, new Set());
    }
    if (this.activeConnections.get(userId).has(clientId)) {
      return;
    }

    this.activeConnections.get(userId).add(clientId);
  };

  getAllParticipantsPoolConnection(id: string): Set<string> {
    if (!this.activeConnections.has(id)) {
      this.activeConnections.set(id, new Set());
    }

    return this.activeConnections.get(id);
  }
}
