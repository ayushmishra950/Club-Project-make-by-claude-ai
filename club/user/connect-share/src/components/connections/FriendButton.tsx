import { UserPlus, UserCheck, Clock, UserMinus, X } from 'lucide-react';
import { type User } from '@/data/mockData';
import { useConnections, type ConnectionStatus } from '@/hooks/useConnections';

interface Props {
  user: User;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function FriendButton({ user, size = 'md', showLabel = true }: Props) {
  const { getStatus, sendRequest, cancelRequest, unfriend } = useConnections();
  const status = getStatus(user.id);

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-xs gap-1.5',
    lg: 'px-4 py-2 text-sm gap-2',
  };

  const config: Record<ConnectionStatus, {
    icon: typeof UserPlus;
    label: string;
    className: string;
    onClick: () => void;
    secondaryAction?: { icon: typeof X; onClick: () => void };
  }> = {
    none: {
      icon: UserPlus,
      label: 'Add Friend',
      className: 'gradient-primary text-primary-foreground hover:opacity-90',
      onClick: () => sendRequest(user),
    },
    request_sent: {
      icon: Clock,
      label: 'Requested',
      className: 'bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive',
      onClick: () => cancelRequest(user.id),
    },
    request_received: {
      icon: UserPlus,
      label: 'Respond',
      className: 'gradient-primary text-primary-foreground hover:opacity-90',
      onClick: () => {}, // handled in request cards
    },
    friends: {
      icon: UserCheck,
      label: 'Friends',
      className: 'bg-primary/10 text-primary hover:bg-destructive/10 hover:text-destructive',
      onClick: () => unfriend(user.id),
      secondaryAction: { icon: UserMinus, onClick: () => unfriend(user.id) },
    },
  };

  const c = config[status];
  const Icon = c.icon;

  return (
    <button
      onClick={c.onClick}
      className={`flex items-center rounded-lg font-semibold transition-all ${sizeClasses[size]} ${c.className}`}
      title={status === 'request_sent' ? 'Cancel request' : status === 'friends' ? 'Unfriend' : c.label}
    >
      <Icon className={size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-3.5 w-3.5'} />
      {showLabel && <span>{c.label}</span>}
    </button>
  );
}
