import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { type User, users, currentUser } from '@/data/mockData';

export type ConnectionStatus = 'none' | 'request_sent' | 'request_received' | 'friends';
export type PrivacyLevel = 'public' | 'friends' | 'private';

export interface FriendRequest {
  id: string;
  from: User;
  to: User;
  time: string;
  mutualFriends: number;
}

interface ConnectionState {
  /** userId -> status */
  statuses: Record<string, ConnectionStatus>;
  /** incoming requests */
  incomingRequests: FriendRequest[];
  /** outgoing requests */
  outgoingRequests: FriendRequest[];
  /** list of friend user objects */
  friends: User[];
  /** mutual friend counts per user */
  mutualCounts: Record<string, number>;
  /** privacy setting for current user */
  privacySetting: PrivacyLevel;

  sendRequest: (user: User) => void;
  cancelRequest: (userId: string) => void;
  acceptRequest: (requestId: string) => void;
  rejectRequest: (requestId: string) => void;
  unfriend: (userId: string) => void;
  getStatus: (userId: string) => ConnectionStatus;
  getMutualCount: (userId: string) => number;
  setPrivacy: (level: PrivacyLevel) => void;
  canViewPrivateContent: (userId: string) => boolean;
  incomingCount: number;
}

const ConnectionContext = createContext<ConnectionState | null>(null);

// Initial state: users[0] and users[3] are already friends, users[2] sent us a request
const initialFriends = [users[0], users[3]];
const initialStatuses: Record<string, ConnectionStatus> = {
  '1': 'friends',
  '4': 'friends',
  '3': 'request_received',
};
const initialIncoming: FriendRequest[] = [
  { id: 'fr1', from: users[2], to: currentUser, time: '1h ago', mutualFriends: 2 },
];
const initialMutuals: Record<string, number> = {
  '1': 3, '2': 5, '3': 2, '4': 4, '5': 1, '6': 3,
};

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [statuses, setStatuses] = useState<Record<string, ConnectionStatus>>(initialStatuses);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>(initialIncoming);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<User[]>(initialFriends);
  const [privacySetting, setPrivacySetting] = useState<PrivacyLevel>('public');

  const getStatus = useCallback((userId: string): ConnectionStatus => {
    return statuses[userId] || 'none';
  }, [statuses]);

  const getMutualCount = useCallback((userId: string): number => {
    return initialMutuals[userId] || 0;
  }, []);

  const sendRequest = useCallback((user: User) => {
    setStatuses(prev => ({ ...prev, [user.id]: 'request_sent' }));
    setOutgoingRequests(prev => [...prev, {
      id: `fr-out-${user.id}`,
      from: currentUser,
      to: user,
      time: 'Just now',
      mutualFriends: initialMutuals[user.id] || 0,
    }]);
  }, []);

  const cancelRequest = useCallback((userId: string) => {
    setStatuses(prev => ({ ...prev, [userId]: 'none' }));
    setOutgoingRequests(prev => prev.filter(r => r.to.id !== userId));
  }, []);

  const acceptRequest = useCallback((requestId: string) => {
    const req = incomingRequests.find(r => r.id === requestId);
    if (!req) return;
    setStatuses(prev => ({ ...prev, [req.from.id]: 'friends' }));
    setFriends(prev => [...prev, req.from]);
    setIncomingRequests(prev => prev.filter(r => r.id !== requestId));
  }, [incomingRequests]);

  const rejectRequest = useCallback((requestId: string) => {
    const req = incomingRequests.find(r => r.id === requestId);
    if (!req) return;
    setStatuses(prev => ({ ...prev, [req.from.id]: 'none' }));
    setIncomingRequests(prev => prev.filter(r => r.id !== requestId));
  }, [incomingRequests]);

  const unfriend = useCallback((userId: string) => {
    setStatuses(prev => ({ ...prev, [userId]: 'none' }));
    setFriends(prev => prev.filter(f => f.id !== userId));
  }, []);

  const canViewPrivateContent = useCallback((userId: string) => {
    if (privacySetting === 'public') return true;
    if (privacySetting === 'friends') return statuses[userId] === 'friends';
    return false;
  }, [privacySetting, statuses]);

  const value: ConnectionState = {
    statuses,
    incomingRequests,
    outgoingRequests,
    friends,
    mutualCounts: initialMutuals,
    privacySetting,
    sendRequest,
    cancelRequest,
    acceptRequest,
    rejectRequest,
    unfriend,
    getStatus,
    getMutualCount,
    setPrivacy: setPrivacySetting,
    canViewPrivateContent,
    incomingCount: incomingRequests.length,
  };

  return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>;
}

export function useConnections() {
  const ctx = useContext(ConnectionContext);
  if (!ctx) throw new Error('useConnections must be used within ConnectionProvider');
  return ctx;
}
