import { cn } from "@/lib/utils";
import { usePresence } from "@/hooks/usePresence";

/**
 * The green dot on an avatar, lit only while that member is connected.
 *
 * It subscribes to presence itself, so a call site just names the member and
 * gets a dot that appears and clears live. Put it inside the `relative`
 * wrapper that holds the avatar image.
 *
 *   <div className="relative">
 *     <img ... />
 *     <OnlineDot userId={member?._id} />
 *   </div>
 */
export const OnlineDot = ({
  userId,
  className,
  /** Set on your own avatar, where a dot says nothing useful. */
  hidden = false
}: {
  userId?: string | null;
  className?: string;
  hidden?: boolean;
}) => {
  const isOnline = usePresence();

  if (hidden || !isOnline(userId)) return null;

  return (
    <span
      className={cn(
        "absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-green-500 ring-2 ring-card",
        className
      )}
      // Otherwise the dot is invisible to a screen reader.
      role="status"
      aria-label="Online"
    />
  );
};

export default OnlineDot;
