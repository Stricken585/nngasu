import type { Role } from '@prisma/client';

// То, что JwtStrategy кладёт в req.user (и gateway — в socket.data.user).
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  groupId: string | null;
}

export interface JwtPayload {
  sub: string;
  role: Role;
}
