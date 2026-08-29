import type { SessionRepository } from "@/repositories/SessionRepository";
import type { UserRepository } from "@/repositories/UserRepository";

/** Compatibility composition used by AuthenticationService and its Prisma adapter. */
export interface AuthenticationRepository extends UserRepository, SessionRepository {}
