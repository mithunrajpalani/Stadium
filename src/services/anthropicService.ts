// =============================================================
// anthropicService.ts — Calls Anthropic API (claude-sonnet-4-20250514)
// Venue state is injected into system prompt for context-aware AI.
// =============================================================

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL             = 'claude-sonnet-4-20250514';

function buildSystemPrompt(venueContext: string): string {
  return `You are StadiumIQ, an AI-powered smart crowd assistant for a large-scale live sporting event. Your job is to help attendees navigate the venue, avoid crowded areas, find food and restrooms efficiently, and have the best possible match-day experience.

LIVE VENUE DATA (updated in real-time):
${venueContext}

BEHAVIOR RULES:
- Always reference specific zone names, wait times, and density percentages from the live data above.
- Recommend the LEAST crowded alternatives whenever a zone is at high or critical status.
- Be concise, friendly, and actionable. Bullet points when listing options.
- For parking: recommend zones with <50% density.
- For gates: recommend gates with <40% density and <5 min wait.
- For food/canteen: always mention current wait time; suggest ordering ahead if busy.
- For restrooms: recommend the least-busy level.
- If halftime is <5 minutes away, proactively warn users and suggest pre-ordering food.
- Use emojis sparingly for clarity (🅿️ parking, 🚪 gate, 🍔 food, 🚻 restroom, ⚠️ alert, ✅ clear).`;
}

/**
 * Call the Anthropic Messages API with full conversation history.
 * @param userMessage  - Latest user message
 * @param venueContext - Live venue state string from crowdSim.getVenueContextString()
 * @param apiKey       - User's Anthropic API key
 * @param history      - Previous messages in the session (max last 10 kept)
 */
export async function askClaude(
  userMessage: string,
  venueContext: string,
  apiKey: string,
  history: Message[] = []
): Promise<string> {
  // Keep last 10 exchanges to stay within token limit
  const trimmed = history.slice(-10);

  const body = {
    model: MODEL,
    max_tokens: 1024,
    system: buildSystemPrompt(venueContext),
    messages: [
      ...trimmed,
      { role: 'user', content: userMessage },
    ],
  };

  const resp = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-allow-browser': 'true',
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    const msg = (err as any)?.error?.message || `HTTP ${resp.status}`;
    throw new Error(msg);
  }

  const data = await resp.json();
  const text = data?.content?.[0]?.text;
  if (!text) throw new Error('Empty response from Claude');
  return text;
}

/** Validate the API key format quickly (does NOT make a real API call) */
export function isValidApiKeyFormat(key: string): boolean {
  return typeof key === 'string' && key.startsWith('sk-ant-') && key.length > 20;
}
