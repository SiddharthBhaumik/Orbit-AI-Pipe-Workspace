export type Role = 'system' | 'user' | 'assistant';
export type ChatMessage = { id: string; role: 'user' | 'assistant'; content: string; createdAt: number; modelId?: string };
export type Conversation = { id: string; title: string; createdAt: number; messages: ChatMessage[] };
export type Model = { id: string; name?: string; description?: string; context_length?: number; shutdown_date?: string | null; pricing?: { prompt?: string; completion?: string } };
export type AuthProfile = { token: string; email?: string; method: 'manual' | 'aipipe' };
