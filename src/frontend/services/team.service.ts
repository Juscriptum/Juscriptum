import api from "./api";
import {
  CreateInvitationData,
  TeamInvitation,
  TeamMember,
  UpdateMemberData,
} from "../types/team.types";

export const teamService = {
  async getMembers(): Promise<TeamMember[]> {
    return api.get<TeamMember[]>("/users/members");
  },

  async updateMember(
    memberId: string,
    data: UpdateMemberData,
  ): Promise<TeamMember> {
    return api.patch<TeamMember>(`/users/members/${memberId}`, data);
  },

  async getInvitations(): Promise<TeamInvitation[]> {
    return api.get<TeamInvitation[]>("/users/invitations");
  },

  async createInvitation(data: CreateInvitationData): Promise<TeamInvitation> {
    return api.post<TeamInvitation>("/users/invitations", data);
  },

  async revokeInvitation(invitationId: string): Promise<TeamInvitation> {
    return api.patch<TeamInvitation>(
      `/users/invitations/${invitationId}/revoke`,
    );
  },
};

export default teamService;
