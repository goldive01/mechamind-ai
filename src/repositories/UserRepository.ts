import type { AuthUser } from "@/domain/entities/Authorization";
import type { CreateUserDto } from "@/dto/auth.dto";

export interface UserRepository {
  findUserByEmail(email: string): Promise<(AuthUser & { passwordHash: string }) | null>;
  findUserById(id: string): Promise<AuthUser | null>;
  listUsers(): Promise<AuthUser[]>;
  createUser(input: Omit<CreateUserDto, "password"> & { passwordHash: string }): Promise<AuthUser>;
  assignRole(userId: string, roleId: string | null): Promise<AuthUser>;
}
