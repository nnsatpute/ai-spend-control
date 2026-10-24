export type Organization = {
  id: string;
  name: string;
  createdAt: Date;
};

export const MEMBER_ROLES = ["OWNER", "ADMIN", "MANAGER", "VIEWER"] as const;

export type MemberRole = (typeof MEMBER_ROLES)[number];
