export interface TrendingTopic {
  id: string;
  title: string;
  category: string;
  engagementCount: number;
  trending: boolean;
}

export interface DebateRoom {
  id: string;
  topic: string;
  description: string;
  category: string;
  host: string;
  hostAvatar: string;
  participantCount: number;
  maxParticipants: number;
  status: "live" | "waiting" | "completed";
  scheduledAt: string;
}

export interface DebateMessage {
  id: string;
  sender: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  side: "for" | "against";
}

export const trendingTopics: TrendingTopic[] = [
  { id: "1", title: "Should AI be regulated by governments?", category: "Technology", engagementCount: 1243, trending: true },
  { id: "2", title: "Is universal basic income feasible?", category: "Economics", engagementCount: 892, trending: true },
  { id: "3", title: "Should space exploration be privatized?", category: "Science", engagementCount: 756, trending: false },
  { id: "4", title: "Is social media doing more harm than good?", category: "Culture", engagementCount: 1567, trending: true },
  { id: "5", title: "Should voting be mandatory?", category: "Politics", engagementCount: 634, trending: false },
  { id: "6", title: "Is nuclear energy the solution to climate change?", category: "Environment", engagementCount: 945, trending: true },
  { id: "7", title: "Should college education be free?", category: "Economics", engagementCount: 1102, trending: false },
  { id: "8", title: "Are electric vehicles truly sustainable?", category: "Environment", engagementCount: 823, trending: true },
];

export const debateRooms: DebateRoom[] = [
  { id: "r1", topic: "AI Regulation Now", description: "Should governments step in to regulate AI development?", category: "Technology", host: "CyberSage", hostAvatar: "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=arena1", participantCount: 4, maxParticipants: 6, status: "live", scheduledAt: "2026-02-20T14:00:00Z" },
  { id: "r2", topic: "UBI: Dream or Reality?", description: "Exploring the feasibility of universal basic income.", category: "Economics", host: "EconNerd", hostAvatar: "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=arena3", participantCount: 2, maxParticipants: 4, status: "waiting", scheduledAt: "2026-02-21T18:00:00Z" },
  { id: "r3", topic: "Social Media Ban for Teens", description: "Should minors be banned from social media?", category: "Culture", host: "DigitalEthicist", hostAvatar: "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=arena5", participantCount: 6, maxParticipants: 6, status: "completed", scheduledAt: "2026-02-19T10:00:00Z" },
  { id: "r4", topic: "Nuclear vs Renewables", description: "Which path leads to a sustainable future?", category: "Environment", host: "GreenThinker", hostAvatar: "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=arena7", participantCount: 3, maxParticipants: 8, status: "waiting", scheduledAt: "2026-02-22T20:00:00Z" },
];

export const mockDebateMessages: DebateMessage[] = [
  { id: "m1", sender: "CyberSage", senderAvatar: "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=arena1", content: "AI development is moving too fast for society to adapt. We need regulatory frameworks now before it's too late.", timestamp: "2:01 PM", side: "for" },
  { id: "m2", sender: "TechFreedom", senderAvatar: "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=arena2", content: "Regulation stifles innovation. The free market will self-correct. Look at how open-source AI has democratized access.", timestamp: "2:03 PM", side: "against" },
  { id: "m3", sender: "CyberSage", senderAvatar: "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=arena1", content: "Self-correction doesn't work when the stakes are this high. We've seen unregulated tech lead to mass misinformation.", timestamp: "2:05 PM", side: "for" },
  { id: "m4", sender: "TechFreedom", senderAvatar: "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=arena2", content: "Misinformation existed long before AI. The solution is better education, not bureaucratic control over technology.", timestamp: "2:07 PM", side: "against" },
];

export const CATEGORIES = ["All", "Technology", "Science", "Politics", "Economics", "Environment", "Culture", "Philosophy", "Sports", "Entertainment", "Health"];
