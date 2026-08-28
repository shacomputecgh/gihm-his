import type { Prisma, User } from '@prisma/client';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { FastifyJWT } from '@fastify/jwt';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  roleCode: string;
  roleName: string;
  scope: string; // NATIONAL | REGIONAL | DISTRICT | FACILITY | PATIENT
  permissions: string[];
  organizationId: string | null;
  facilityId: string | null;
  regionId: string | null;
  districtId: string | null;
  // Scope context names (loaded with the user's relations) so the UI can show
  // e.g. "Kumasi Metropolitan" instead of a bare scope label.
  regionName: string | null;
  districtName: string | null;
  facilityName: string | null;
}

export function toAuthUser(
  user: User & {
    role: { code: string; name: string; scope: string; permissions: string };
    region?: { name: string } | null;
    district?: { name: string } | null;
    facility?: { name: string } | null;
  },
): AuthUser {
  let permissions: string[] = [];
  try {
    permissions = JSON.parse(user.role.permissions);
  } catch {
    permissions = [];
  }
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    roleCode: user.role.code,
    roleName: user.role.name,
    scope: user.role.scope,
    permissions,
    organizationId: user.organizationId,
    facilityId: user.facilityId,
    regionId: user.regionId,
    districtId: user.districtId,
    regionName: user.region?.name ?? null,
    districtName: user.district?.name ?? null,
    facilityName: user.facility?.name ?? null,
  };
}

export type PatientWhere = Prisma.PatientWhereInput;
export type EncounterWhere = Prisma.EncounterWhereInput;

// Type `request.user` as AuthUser (set by guards after JWT verification).
declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: AuthUser;
  }
}
