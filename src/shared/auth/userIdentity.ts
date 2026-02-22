export type UserLike = {
  avatar?: string | null;
  avatarUrl?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  username?: string | null;
  email?: string | null;
};

export interface UserIdentity {
  userAvatar: string | null | undefined;
  primaryIdentity: string;
  secondaryIdentity: string;
  avatarFallback: string;
}

const getDisplayName = (user: UserLike | null | undefined): string => {
  if (!user) {
    return "";
  }

  const firstName = user.first_name ?? user.firstName ?? "";
  const lastName = user.last_name ?? user.lastName ?? "";
  const combined = `${firstName} ${lastName}`.trim();

  if (combined.length > 0) {
    return combined;
  }

  return user.displayName ?? user.username ?? "";
};

export const getUserIdentity = (
  user: UserLike | null | undefined,
): UserIdentity => {
  const displayName = getDisplayName(user);
  const primaryIdentity =
    displayName || user?.username || user?.email || "Utilisateur";
  const secondaryIdentity = user?.email || user?.username || "Compte";
  const avatarFallback =
    primaryIdentity
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((segment) => segment[0]?.toUpperCase() ?? "")
      .join("") || "U";

  return {
    userAvatar: user?.avatar || user?.avatarUrl,
    primaryIdentity,
    secondaryIdentity,
    avatarFallback,
  };
};
