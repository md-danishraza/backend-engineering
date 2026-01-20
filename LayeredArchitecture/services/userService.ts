// userService.ts
import * as userRepo from "./repository/userRepo";

export const getUserProfile = async (userId: number) => {
  const user = await userRepo.findUserById(userId);

  if (!user) throw new Error("User not found");

  // Business Logic: Remove password before sending back
  const { password, ...safeUser } = user;
  return safeUser;
};
