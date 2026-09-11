export interface User {
  id: string;
  name: string;
  avatar: string;
  occupation: string;
  isOnline: boolean;
}

export interface Story {
  id: string;
  user: User;
  image: string;
  viewed: boolean;
}

export interface Comment {
  id: string;
  user: User;
  text: string;
  time: string;
  likes: number;
  replies?: Comment[];
}

export interface Post {
  id: string;
  user: User;
  text: string;
  images: string[];
  likes: number;
  comments: Comment[];
  shares: number;
  time: string;
  liked: boolean;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  time: string;
}

export interface Chat {
  id: string;
  user: User;
  messages: Message[];
  unread: number;
}

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'share' | 'friend_request' | 'event' | 'admin';
  user: User;
  text: string;
  time: string;
  read: boolean;
  link?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  image: string;
  attendees: number;
  isPrivate: boolean;
  rsvpd: boolean;
}

export interface Business {
  id: string;
  name: string;
  category: string;
  location: string;
  description: string;
  owner: User;
  rating: number;
  image: string;
}

const users: User[] = [
  { id: '1', name: 'Sarah Chen', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face', occupation: 'Product Designer', isOnline: true },
  { id: '2', name: 'Marcus Johnson', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face', occupation: 'Software Engineer', isOnline: true },
  { id: '3', name: 'Priya Patel', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face', occupation: 'Marketing Lead', isOnline: false },
  { id: '4', name: 'Alex Rivera', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face', occupation: 'Photographer', isOnline: true },
  { id: '5', name: 'Emma Wilson', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face', occupation: 'Content Creator', isOnline: false },
  { id: '6', name: 'David Kim', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face', occupation: 'Entrepreneur', isOnline: true },
];

export const currentUser: User = { id: '0', name: 'You', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face', occupation: 'Community Member', isOnline: true };

export const mockStories: Story[] = [
  { id: '1', user: currentUser, image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop', viewed: false },
  { id: '2', user: users[0], image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=600&fit=crop', viewed: false },
  { id: '3', user: users[1], image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=600&fit=crop', viewed: true },
  { id: '4', user: users[2], image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=600&fit=crop', viewed: false },
  { id: '5', user: users[3], image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=600&fit=crop', viewed: true },
  { id: '6', user: users[4], image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=600&fit=crop', viewed: false },
  { id: '7', user: users[5], image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=600&fit=crop', viewed: true },
];

export const mockPosts: Post[] = [
  {
    id: '1', user: users[0], text: 'Just finished designing the new community dashboard! What do you all think? 🎨✨', images: ['https://images.unsplash.com/photo-1545235617-9465d2a55698?w=600&h=400&fit=crop'], likes: 42, shares: 8, time: '2h ago', liked: false,
    comments: [
      { id: 'c1', user: users[1], text: 'This looks amazing Sarah! Love the color scheme 🔥', time: '1h ago', likes: 5, replies: [
        { id: 'c1r1', user: users[0], text: 'Thanks Marcus! Took a lot of iterations 😅', time: '45m ago', likes: 2 }
      ]},
      { id: 'c2', user: users[2], text: 'Can we use this for our next campaign?', time: '30m ago', likes: 1 },
    ]
  },
  {
    id: '2', user: users[3], text: 'Golden hour in the city never gets old 🌅 Shot on my new lens. #photography #citylife', images: ['https://images.unsplash.com/photo-1477346611705-65d1883cee1e?w=600&h=400&fit=crop', 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=600&h=400&fit=crop'], likes: 89, shares: 23, time: '4h ago', liked: true,
    comments: [
      { id: 'c3', user: users[4], text: 'Stunning captures Alex! 📸', time: '3h ago', likes: 8 },
    ]
  },
  {
    id: '3', user: users[4], text: 'Just published my latest blog on content strategy for 2024. Link in bio! 📝 Would love your thoughts on the emerging trends section.', images: [], likes: 31, shares: 12, time: '6h ago', liked: false,
    comments: []
  },
  {
    id: '4', user: users[5], text: 'Excited to announce our startup just closed Series A! 🚀 Thank you to everyone in this community who supported us from day one. Big things coming!', images: ['https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&h=400&fit=crop'], likes: 156, shares: 45, time: '8h ago', liked: true,
    comments: [
      { id: 'c4', user: users[0], text: 'Congratulations David! 🎉🥳', time: '7h ago', likes: 12 },
      { id: 'c5', user: users[1], text: 'Well deserved! The product is incredible', time: '6h ago', likes: 8 },
      { id: 'c6', user: users[2], text: 'This is huge! Let\'s celebrate 🍾', time: '5h ago', likes: 4 },
    ]
  },
];

export const mockChats: Chat[] = [
  { id: '1', user: users[0], unread: 3, messages: [
    { id: 'm1', text: 'Hey! Did you see the new designs?', senderId: '1', time: '10:30 AM' },
    { id: 'm2', text: 'Yes! They look great', senderId: '0', time: '10:32 AM' },
    { id: 'm3', text: 'Want to hop on a call to discuss?', senderId: '1', time: '10:33 AM' },
    { id: 'm4', text: 'I have some feedback on the colors', senderId: '1', time: '10:34 AM' },
    { id: 'm5', text: 'Also the typography could be improved', senderId: '1', time: '10:35 AM' },
  ]},
  { id: '2', user: users[1], unread: 0, messages: [
    { id: 'm6', text: 'The PR is ready for review', senderId: '2', time: '9:00 AM' },
    { id: 'm7', text: 'I\'ll check it after lunch', senderId: '0', time: '9:15 AM' },
  ]},
  { id: '3', user: users[3], unread: 1, messages: [
    { id: 'm8', text: 'Can you send the photos from last event?', senderId: '0', time: 'Yesterday' },
    { id: 'm9', text: 'Sure! Sending them now 📸', senderId: '4', time: 'Yesterday' },
  ]},
  { id: '4', user: users[4], unread: 0, messages: [
    { id: 'm10', text: 'Loved your latest post!', senderId: '5', time: 'Monday' },
  ]},
  { id: '5', user: users[5], unread: 2, messages: [
    { id: 'm11', text: 'Meeting at 3pm tomorrow?', senderId: '6', time: '2h ago' },
    { id: 'm12', text: 'Works for me!', senderId: '0', time: '1h ago' },
  ]},
];

export const mockNotifications: Notification[] = [
  { id: '1', type: 'like', user: users[1], text: 'liked your post', time: '5m ago', read: false },
  { id: '2', type: 'comment', user: users[0], text: 'commented on your photo', time: '15m ago', read: false },
  { id: '3', type: 'friend_request', user: users[2], text: 'sent you a friend request', time: '1h ago', read: false },
  { id: '4', type: 'share', user: users[3], text: 'shared your post', time: '2h ago', read: true },
  { id: '5', type: 'event', user: users[5], text: 'invited you to "Tech Meetup 2024"', time: '3h ago', read: true },
  { id: '6', type: 'admin', user: { ...users[0], name: 'Admin' }, text: 'New community guidelines have been posted', time: '5h ago', read: true },
  { id: '7', type: 'like', user: users[4], text: 'liked your comment', time: '1d ago', read: true },
];

export const mockEvents: Event[] = [
  { id: '1', title: 'Tech Meetup 2024', description: 'Annual technology meetup for community members. Networking, talks, and demos!', date: 'Mar 15, 2024', location: 'Downtown Convention Center', image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=300&fit=crop', attendees: 128, isPrivate: false, rsvpd: false },
  { id: '2', title: 'Design Workshop', description: 'Hands-on workshop on modern UI/UX design principles and tools.', date: 'Mar 22, 2024', location: 'Creative Hub', image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&h=300&fit=crop', attendees: 45, isPrivate: false, rsvpd: true },
  { id: '3', title: 'Private Networking Dinner', description: 'Exclusive dinner for premium members. Limited spots available.', date: 'Apr 5, 2024', location: 'Skyline Restaurant', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=300&fit=crop', attendees: 20, isPrivate: true, rsvpd: false },
];

export const mockBusinesses: Business[] = [
  { id: '1', name: 'Chen Design Studio', category: 'Design', location: 'San Francisco, CA', description: 'Full-service design studio specializing in brand identity and digital products.', owner: users[0], rating: 4.8, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=250&fit=crop' },
  { id: '2', name: 'Rivera Photography', category: 'Photography', location: 'Los Angeles, CA', description: 'Professional photography for events, portraits, and commercial projects.', owner: users[3], rating: 4.9, image: 'https://images.unsplash.com/photo-1471341971476-ae15ff5dd4ea?w=400&h=250&fit=crop' },
  { id: '3', name: 'Kim Ventures', category: 'Consulting', location: 'New York, NY', description: 'Startup consulting and venture capital advisory services.', owner: users[5], rating: 4.7, image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=250&fit=crop' },
  { id: '4', name: 'Patel Marketing Co', category: 'Marketing', location: 'Austin, TX', description: 'Digital marketing agency specializing in growth strategy and content.', owner: users[2], rating: 4.6, image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop' },
];

export { users };
