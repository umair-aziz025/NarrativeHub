import type { InsertUser, InsertRoom, InsertStory, User, Room } from "@shared/schema";

// Custom API request function with authentication
async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  // For MVP, use a mock user ID. In production, this would come from auth context
  const headers = {
    "Content-Type": "application/json",
    "x-user-id": "user-1", // Mock user ID
  };

  const res = await fetch(url, {
    method,
    headers: data ? headers : { "x-user-id": "user-1" },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
  
  return res;
}

export const api = {
  // Users
  async createUser(userData: InsertUser): Promise<User> {
    const response = await apiRequest("POST", "/api/users", userData);
    return response.json();
  },

  async getUser(id: string): Promise<User> {
    const response = await apiRequest("GET", `/api/users/${id}`);
    return response.json();
  },

  // Rooms
  async createRoom(roomData: InsertRoom): Promise<Room> {
    const response = await apiRequest("POST", "/api/rooms", roomData);
    return response.json();
  },

  async joinRoom(code: string): Promise<Room> {
    const response = await apiRequest("GET", `/api/rooms/code/${code}`);
    return response.json();
  },

  // Stories
  async submitStory(storyData: InsertStory): Promise<void> {
    await apiRequest("POST", "/api/stories", storyData);
  },

  async getNextChainId(): Promise<number> {
    const response = await apiRequest("GET", "/api/stories/next-chain-id");
    const data = await response.json();
    return data.chainId;
  },

  async toggleHeart(storyId: string): Promise<{ hearted: boolean }> {
    const response = await apiRequest("POST", `/api/stories/${storyId}/heart`);
    return response.json();
  },

  // Voice features
  async transcribeAudio(audioBlob: Blob): Promise<{ text: string }> {
    const formData = new FormData();
    formData.append('audio', audioBlob);
    
    const res = await fetch('/api/voice/transcribe', {
      method: 'POST',
      headers: { "x-user-id": "user-1" },
      body: formData,
    });
    
    return res.json();
  },

  // AI features
  async generateStoryContinuation(context: string): Promise<{ continuation: string }> {
    const response = await apiRequest("POST", "/api/ai/continue-story", { context });
    return response.json();
  },

  // Export features
  async exportStoryChain(chainId: number, format: 'pdf' | 'image'): Promise<{ url: string }> {
    const response = await apiRequest("GET", `/api/export/chain/${chainId}?format=${format}`);
    return response.json();
  },
};
