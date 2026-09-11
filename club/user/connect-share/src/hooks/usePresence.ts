import { useCallback, useSyncExternalStore } from "react";
import { getPresenceVersion, subscribePresence, isUserOnline } from "@/socket/socket";

/**
 * Live "is this member online right now" for any page.
 *
 * Reads the presence set the socket module keeps, and re-renders the component
 * whenever it changes. Pages used to show whatever `isOnline` the API had
 * baked into the list when it was fetched, so a member coming online during
 * the session never lit up until the next refresh.
 *
 *   const online = usePresence();
 *   {online(friend._id) && <span className="... bg-green-500" />}
 */
export const usePresence = () => {
  // The version changes on every presence update, including one member
  // replacing another, which a size comparison would miss.
  const version = useSyncExternalStore(subscribePresence, getPresenceVersion, () => 0);

  return useCallback((userId?: string | null) => isUserOnline(userId), [version]);
};

export default usePresence;
