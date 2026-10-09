/**
 * AI assistant port. The UI depends only on this interface; point `setAiClient` at an adapter
 * for the Python AI service (HTTP, SSE or WebSocket) and no screen changes.
 */
export interface AiChatTurn {
  role: 'user' | 'assistant';
  text: string;
}

export interface AiChatRequest {
  message: string;
  history: AiChatTurn[];
  petId?: string;
  signal?: AbortSignal;
}

export interface AiChatReply {
  text: string;
  /** Model identifier for audit and provenance. */
  model?: string;
}

export interface AiClient {
  send(request: AiChatRequest): Promise<AiChatReply>;
}

const MOCK_REPLY =
  "Based on your pet's profile, I'd recommend a grain-free salmon-based diet split into two meals. " +
  'Keep an eye on any scratching; if it persists beyond 3 days, a teleconsult is a good idea. Want me to book one?';

const mockClient: AiClient = {
  send: ({ signal }) =>
    new Promise<AiChatReply>((resolve, reject) => {
      const timer = setTimeout(() => resolve({ text: MOCK_REPLY, model: 'mock-assistant' }), 700);
      signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new Error('aborted'));
      });
    }),
};

let active: AiClient = mockClient;

export const aiClient: AiClient = { send: (req) => active.send(req) };

export function setAiClient(next: AiClient) {
  active = next;
}
