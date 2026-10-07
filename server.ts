import express from 'express';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality } from '@google/genai';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Shared server-side Google GenAI client with required User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const SYSTEM_INSTRUCTION = `You are NOTO's Monastic AI Flow Coach, inspired by Japanese spatial discipline (Ma) and warm editorial productivity.
Your purpose:
1. Help the user prioritize ruthlessly and protect deep state momentum.
2. Break down overwhelming tasks into bite-sized 15, 25, or 45-minute focus sprints.
3. Suggest optimal rest intervals, silent periods, and elimination of cognitive clutter.
4. If asked about current research, trends, productivity science, or factual news, provide concise and accurate insights grounded in Google Search data.
Tone: Calm, concise, thoughtful, unhurried. Do not use corporate clichés, hyperactive exclamation marks, or synthetic gamification. Keep responses clear and formatted with clean bullet points or short paragraphs.`;

// Helper function to generate high-signal offline flow advice if quota is exhausted
function generateCalmOfflineResponse(lastUserMessage: string, context: string): string {
  const lower = lastUserMessage.toLowerCase();

  if (lower.includes('deconstruct') || lower.includes('break down') || lower.includes('pecah') || lower.includes('tugas')) {
    return `### 🧘 Monastic Task Deconstruction (Offline Flow)

To protect your cognitive energy and avoid overwhelm, let's divide this into three disciplined focus sprints:

1. **Phase 1: Setup & Perimeter Definition (10 mins)**
   - Eliminate all tabs and phone notifications.
   - Outline the 3 essential questions this task must answer.
2. **Phase 2: Deep Production Block (25 mins)**
   - Enter uninterrupted execution. No self-editing, just pure draft momentum.
3. **Phase 3: Synthesis & Rest Verification (10 mins)**
   - Review deliverables against initial requirements.
   - Step away for 5 minutes of deliberate physical rest.

*(Note: API quota is currently resting. To enable continuous live AI reasoning, check your key in **Settings > Secrets**).*`;
  }

  if (lower.includes('research') || lower.includes('attention') || lower.includes('studi') || lower.includes('fokus')) {
    return `### 🧠 Cognitive Rhythms & Attention Science (Synthesized)

Modern neuroscience on sustained attention emphasizes three foundational principles:

- **Ultradian Cycles (45–90 min)**: The brain operates on biological cycles. Focus drops steeply after 45–50 minutes of high-intensity cognitive load.
- **Micro-Restorative Pauses (5 min)**: Dr. Andrew Huberman's research demonstrates that optic flow (looking at the distant horizon) restores autonomic balance faster than passive screen scrolling.
- **The "Ma" Principle**: Leaving empty buffer spaces between tasks prevents context-switching residue from degrading your subsequent work.

*(Note: Live search grounding reached quota limits. For uncapped web queries, ensure a billing-enabled key is active in **Settings > Secrets**).*`;
  }

  return `### 🕊️ Monastic Flow Guidance

When high cognitive friction occurs, simplify your perimeter:

1. **Choose Exactly One Thing**: Look at your today's schedule and circle the single item that truly moves the needle.
2. **Protect the Next 45 Minutes**: Close all communication channels. The world can wait 45 minutes for you to build real value.
3. **Breathe & Begin**: Start with the easiest 2 minutes of the task to establish momentum.

*(Note: Current API quota limit reached. To increase limits, update your API key in **Settings > Secrets**).*`;
}

// 1. AI Chat Endpoint (Supports multi-turn chat with model selection & Google Search Grounding with robust fallbacks)
app.post('/api/ai/chat', async (req, res) => {
  const {
    messages,
    model = 'gemini-3.5-flash',
    useSearch = false,
    context = '',
  } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required.' });
  }

  // Prepare contents formatted for generateContent
  const formattedContents = messages.map((m: { role: string; content: string }) => ({
    role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const lastUserMsg = messages[messages.length - 1]?.content || '';

  // Prepare system instruction with context
  let fullSystemInstruction = SYSTEM_INSTRUCTION;
  if (context) {
    fullSystemInstruction += `\n\nCurrent user context (tasks & schedule):\n${context}`;
  }

  const baseConfig: Record<string, unknown> = {
    systemInstruction: fullSystemInstruction,
    temperature: 0.7,
  };

  // Model fallback sequence to protect against 429 Rate Limits / Quotas
  const candidates: { model: string; withSearch: boolean }[] = [];

  // Primary preference
  let initialModel = 'gemini-3.8-flash';
  if (model === 'gemini-3.1-pro-preview') {
    initialModel = 'gemini-3.1-pro-preview';
  } else if (model === 'gemini-3.1-flash-lite') {
    initialModel = 'gemini-3.1-flash-lite';
  } else if (model === 'gemini-3.5-flash') {
    initialModel = 'gemini-3.5-flash';
  }

  candidates.push({ model: initialModel, withSearch: useSearch });

  // Fallback 1: Try without search if search was enabled (search grounding has separate strict quotas)
  if (useSearch) {
    candidates.push({ model: initialModel, withSearch: false });
  }

  // Fallback 2: High-throughput gemini-3.8-flash
  if (initialModel !== 'gemini-3.8-flash') {
    candidates.push({ model: 'gemini-3.8-flash', withSearch: false });
  }

  // Fallback 3: gemini-3.1-flash-lite
  if (initialModel !== 'gemini-3.1-flash-lite') {
    candidates.push({ model: 'gemini-3.1-flash-lite', withSearch: false });
  }

  let finalResponse = null;
  let modelUsed = initialModel;
  let webSources: { uri: string; title: string }[] = [];
  let isRateLimited = false;

  for (const candidate of candidates) {
    try {
      const config: Record<string, unknown> = { ...baseConfig };
      if (candidate.withSearch) {
        config.tools = [{ googleSearch: {} }];
      } else {
        delete config.tools;
      }

      const response = await ai.models.generateContent({
        model: candidate.model,
        contents: formattedContents,
        config,
      });

      if (response && response.text) {
        finalResponse = response.text;
        modelUsed = candidate.model;
        const groundingChunks =
          response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        webSources = groundingChunks
          .map((chunk: { web?: { uri?: string; title?: string } }) => chunk.web)
          .filter((web): web is { uri: string; title: string } => Boolean(web?.uri));
        break;
      }
    } catch (err: any) {
      console.warn(`Candidate ${candidate.model} (search=${candidate.withSearch}) failed:`, err?.message || err);
      const errMsg = String(err?.message || '');
      if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota')) {
        isRateLimited = true;
      }
    }
  }

  // If all live models failed due to quota exhaustion, provide graceful offline coaching
  if (!finalResponse) {
    if (isRateLimited) {
      return res.json({
        text: generateCalmOfflineResponse(lastUserMsg, context),
        modelUsed: 'offline-coach',
        isQuotaNotice: true,
        sources: [],
      });
    }

    // Generic error fallback
    return res.status(500).json({
      error: 'Unable to contact Gemini AI services. Please verify your connection or try again shortly.',
    });
  }

  return res.json({
    text: finalResponse,
    modelUsed,
    sources: webSources,
  });
});

// 2. Fast Task Breakdown & AI Planning Endpoint (with fallback)
app.post('/api/ai/breakdown-task', async (req, res) => {
  try {
    const { taskTitle, durationMin = 45 } = req.body;
    if (!taskTitle) {
      return res.status(400).json({ error: 'Task title is required.' });
    }

    const prompt = `Deconstruct the following task into 2 to 4 disciplined, focused sub-steps fitting a ${durationMin}-minute deep work block:
Task: "${taskTitle}"

Provide your answer in clean bullet points with suggested minutes for each micro-step (e.g., "• Step 1 (10m): ..."). Keep it minimalist and actionable.`;

    let breakdownText = '';
    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];

    for (const m of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: m,
          contents: prompt,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
          },
        });
        if (response && response.text) {
          breakdownText = response.text;
          break;
        }
      } catch (err: any) {
        console.warn(`Breakdown with model ${m} failed:`, err?.message || err);
      }
    }

    if (!breakdownText) {
      const step1 = Math.round(durationMin * 0.25);
      const step2 = Math.round(durationMin * 0.55);
      const step3 = durationMin - step1 - step2;
      breakdownText = `• Step 1 (${step1}m): Setup perimeter & gather resources for "${taskTitle}".\n• Step 2 (${step2}m): Deep execution sprint without self-editing.\n• Step 3 (${step3}m): Review output against initial objectives.`;
    }

    return res.json({
      breakdown: breakdownText,
    });
  } catch (error: unknown) {
    console.error('Error in /api/ai/breakdown-task:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
});

// 3. WebSocket Server for Gemini Live API (gemini-3.8-live) real-time voice conversations
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;
  if (pathname === '/live' || pathname === '/api/live') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
});

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('Client connected to Gemini Live voice bridge');
  let liveSession: any = null;

  try {
    // Connect to Gemini 3.8 Live API
    liveSession = await ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Zephyr' },
          },
        },
        systemInstruction: 'You are NOTO, a calm, monastic focus companion. Speak with quiet warmth, brevity, and practical focus advice in the user\'s language.',
      },
      callbacks: {
        onmessage: (message: any) => {
          try {
            // Forward model audio chunks to browser
            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ audio: audioData }));
            }
            if (message.serverContent?.interrupted && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          } catch (err) {
            console.error('Error forwarding live message to client:', err);
          }
        },
        onclose: () => {
          console.log('Gemini Live session closed');
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ closed: true }));
          }
        },
      },
    });

    clientWs.send(JSON.stringify({ connected: true }));

    // Listen for audio from client
    clientWs.on('message', (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.audio && liveSession) {
          liveSession.sendRealtimeInput({
            audio: {
              data: parsed.audio,
              mimeType: 'audio/pcm;rate=16000',
            },
          });
        }
        if (parsed.text && liveSession) {
          liveSession.sendRealtimeInput({
            text: parsed.text,
          });
        }
      } catch (err) {
        console.error('Error processing client audio message:', err);
      }
    });

    clientWs.on('close', () => {
      console.log('Client disconnected from Live bridge');
      if (liveSession && typeof liveSession.close === 'function') {
        liveSession.close();
      }
    });
  } catch (err: unknown) {
    console.error('Failed to initialize Gemini Live session:', err);
    if (clientWs.readyState === WebSocket.OPEN) {
      const errMsg = err instanceof Error ? err.message : 'Failed to connect to Live session';
      clientWs.send(JSON.stringify({ error: errMsg }));
      clientWs.close();
    }
  }
});

// Mount Vite or serve static dist
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
