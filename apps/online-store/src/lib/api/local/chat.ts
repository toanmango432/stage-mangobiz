// Local Chat API Implementation
// Replaces supabase/functions/chat/index.ts with local mock

import { LOCAL_API_CONFIG } from './config';
import type { 
  ChatMessage, 
  ChatResponse, 
  ChatStartResponse, 
  ChatCard, 
  MangoService, 
  MangoAvailability, 
  MangoSalonInfo, 
  MangoPolicies,
  AIResponse,
  ToolCall,
  RateLimitInfo
} from './types';

// Rate limiting (in-memory)
const rateLimits = new Map<string, RateLimitInfo>();

// Mock Mango Client (same as Supabase function)
const mangoClient = {
  async getServices(): Promise<MangoService[]> {
    return [
      { id: 's1', name: 'Gel Manicure', price: 45, duration: 60, category: 'Nails' },
      { id: 's2', name: 'Classic Pedicure', price: 55, duration: 75, category: 'Nails' },
      { id: 's3', name: 'Haircut & Style', price: 85, duration: 90, category: 'Hair' },
      { id: 's4', name: 'Facial Treatment', price: 120, duration: 60, category: 'Skincare' }
    ];
  },
  
  async getAvailability(serviceId: string, date: string): Promise<MangoAvailability[]> {
    return [
      { time: '10:00 AM', available: true },
      { time: '11:30 AM', available: true },
      { time: '2:00 PM', available: true },
      { time: '4:00 PM', available: false }
    ];
  },
  
  async getSalonInfo(): Promise<MangoSalonInfo> {
    return {
      name: 'Mango Nail & Beauty Salon',
      hours: 'Mon-Sat: 9am-7pm, Sun: 10am-6pm',
      address: '123 Beauty Lane, Style City, SC 12345',
      phone: '(555) 123-4567',
      email: 'hello@mangosalon.com'
    };
  },
  
  async getPolicies(): Promise<MangoPolicies> {
    return {
      cancellation: '24-hour cancellation notice required for full refund',
      lateness: 'Please arrive 10 minutes early. Late arrivals may need to reschedule',
      payment: 'We accept all major credit cards, cash, and gift cards'
    };
  }
};

// AI Provider (Gemini via Lovable AI)
async function generateAI(messages: ChatMessage[], tools?: any[]): Promise<AIResponse> {
  // Support both Next.js and Vite env vars
  const LOVABLE_API_KEY =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_LOVABLE_API_KEY) ||
    (typeof import.meta !== 'undefined' &&
      (import.meta.env as Record<string, string | undefined>)?.VITE_LOVABLE_API_KEY);
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured (NEXT_PUBLIC_LOVABLE_API_KEY or VITE_LOVABLE_API_KEY)');
  }

  const body: any = {
    model: LOCAL_API_CONFIG.AI.MODEL,
    messages,
  };

  if (tools) {
    body.tools = tools;
    body.tool_choice = 'auto';
  }

  const response = await fetch(LOCAL_API_CONFIG.AI.GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('AI gateway error:', response.status, text);
    throw new Error('AI gateway error');
  }

  const data = await response.json();
  const message = data.choices[0].message;
  
  return {
    text: message.content || '',
    toolCalls: message.tool_calls?.map((tc: any) => ({
      name: tc.function.name,
      args: JSON.parse(tc.function.arguments)
    }))
  };
}

// Grounding/RAG - simple keyword matching for demo
async function retrieveContext(query: string): Promise<string> {
  const salonInfo = await mangoClient.getSalonInfo();
  const policies = await mangoClient.getPolicies();
  const services = await mangoClient.getServices();
  
  const contexts: string[] = [];
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('hour') || lowerQuery.includes('open') || lowerQuery.includes('close')) {
    contexts.push(`Store Hours: ${salonInfo.hours}`);
  }
  
  if (lowerQuery.includes('location') || lowerQuery.includes('address') || lowerQuery.includes('where')) {
    contexts.push(`Location: ${salonInfo.address}`);
  }
  
  if (lowerQuery.includes('cancel') || lowerQuery.includes('refund')) {
    contexts.push(`Cancellation Policy: ${policies.cancellation}`);
  }
  
  if (lowerQuery.includes('service') || lowerQuery.includes('offer') || lowerQuery.includes('do you have')) {
    contexts.push(`Available Services: ${services.map(s => `${s.name} ($${s.price})`).join(', ')}`);
  }
  
  return contexts.join('\n\n');
}

// Rate limiting check
function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const limit = rateLimits.get(identifier);
  
  if (!limit || now > limit.resetAt) {
    rateLimits.set(identifier, { 
      count: 1, 
      resetAt: now + LOCAL_API_CONFIG.RATE_LIMIT.WINDOW_MS 
    });
    return true;
  }
  
  if (limit.count >= LOCAL_API_CONFIG.RATE_LIMIT.MAX_REQUESTS) {
    return false;
  }
  
  limit.count++;
  return true;
}

// Simulate network delay
async function simulateDelay(): Promise<void> {
  if (LOCAL_API_CONFIG.MOCK_DATA.ENABLE_DELAYS) {
    await new Promise(resolve => setTimeout(resolve, LOCAL_API_CONFIG.MOCK_DATA.DEFAULT_DELAY));
  }
}

// Intent detection and routing
export async function handleChatMessage(
  sessionId: string, 
  message: string, 
  pageContext?: string
): Promise<ChatResponse> {
  console.log('Chat message:', { sessionId, message, pageContext });
  
  // Simulate network delay
  await simulateDelay();
  
  // Get grounding context
  const groundingContext = await retrieveContext(message);
  
  // Define tools for function calling
  const tools = [
    {
      type: 'function',
      function: {
        name: 'search_services',
        description: 'Search for salon services by name or category',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Service name or category to search for' }
          },
          required: ['query']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'get_availability',
        description: 'Check available time slots for a service',
        parameters: {
          type: 'object',
          properties: {
            serviceId: { type: 'string', description: 'Service ID to check' },
            date: { type: 'string', description: 'Date in YYYY-MM-DD format' }
          },
          required: ['serviceId']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'navigate_to',
        description: 'Navigate user to a specific page',
        parameters: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path to navigate to, e.g., /book, /shop, /memberships' }
          },
          required: ['path']
        }
      }
    }
  ];
  
  // Build system prompt
  const systemPrompt = `You are Mango, a helpful AI assistant for Mango Nail & Beauty Salon. 
You help customers book services, find products, and answer questions about the salon.

Current Context:
${groundingContext || 'No specific context'}

Guidelines:
- Be warm, friendly, and professional
- Use the provided context to answer factual questions
- If booking, use tools to check availability
- Never invent prices or information
- Keep responses concise and helpful
- Politely decline medical, legal, or financial advice

Current page: ${pageContext || 'unknown'}`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: message }
  ];
  
  try {
    const aiResponse = await generateAI(messages, tools);
    
    // Handle tool calls
    const cards: ChatCard[] = [];
    let finalText = aiResponse.text;
    
    if (aiResponse.toolCalls && aiResponse.toolCalls.length > 0) {
      for (const toolCall of aiResponse.toolCalls) {
        console.log('Tool call:', toolCall);
        
        if (toolCall.name === 'search_services') {
          const services = await mangoClient.getServices();
          const filtered = services.filter(s => 
            s.name.toLowerCase().includes(toolCall.args.query.toLowerCase()) ||
            s.category.toLowerCase().includes(toolCall.args.query.toLowerCase())
          );
          
          cards.push(...filtered.map(s => ({
            type: 'service' as const,
            id: s.id,
            title: s.name,
            description: `${s.duration} minutes`,
            price: s.price,
            action: { label: 'Book Now', path: `/book?service=${s.id}` }
          })));
          
          finalText = `I found ${filtered.length} service(s) for you:`;
        }
        
        if (toolCall.name === 'get_availability') {
          const slots = await mangoClient.getAvailability(
            toolCall.args.serviceId, 
            toolCall.args.date || new Date().toISOString().split('T')[0]
          );
          
          const availableSlots = slots.filter(s => s.available);
          cards.push({
            type: 'availability' as const,
            slots: availableSlots.map(s => s.time)
          });
          
          finalText = `Here are the available time slots:`;
        }
        
        if (toolCall.name === 'navigate_to') {
          cards.push({
            type: 'navigation' as const,
            path: toolCall.args.path,
            label: `Go to ${toolCall.args.path}`
          });
        }
      }
    }
    
    return {
      sessionId,
      message: finalText,
      cards,
      suggestions: ['Check availability', 'View services', 'Contact us']
    };
    
  } catch (error) {
    console.error('AI generation error:', error);
    
    // Fallback to rule-based responses
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('hour') || lowerMessage.includes('open')) {
      const info = await mangoClient.getSalonInfo();
      return {
        sessionId,
        message: `Our hours are: ${info.hours}`,
        cards: [],
        suggestions: ['Book appointment', 'View services', 'Contact us']
      };
    }
    
    if (lowerMessage.includes('book') || lowerMessage.includes('appointment')) {
      return {
        sessionId,
        message: 'I can help you book an appointment! What service are you interested in?',
        cards: [],
        suggestions: ['Gel Manicure', 'Pedicure', 'Haircut', 'Facial']
      };
    }
    
    return {
      sessionId,
      message: 'I\'m here to help! You can ask about our services, book appointments, or check our hours.',
      cards: [],
      suggestions: ['View services', 'Book appointment', 'Store hours']
    };
  }
}

// Start chat session
export async function startChatSession(sessionId?: string): Promise<ChatStartResponse> {
  await simulateDelay();
  
  const newSessionId = sessionId || crypto.randomUUID();
  const salonInfo = await mangoClient.getSalonInfo();
  
  return {
    sessionId: newSessionId,
    greeting: `Hi! I'm Mango Assistant 🤍 How can I help you today?`,
    suggestions: ['Book appointment', 'View services', 'Store hours', 'Gift cards']
  };
}

// Get chat suggestions
export async function getChatSuggestions(page: string = 'home'): Promise<string[]> {
  await simulateDelay();
  
  const suggestions: Record<string, string[]> = {
    home: ['Book appointment', 'View services', 'Special offers'],
    book: ['Check availability', 'View all services', 'Reschedule'],
    shop: ['Best sellers', 'New arrivals', 'Gift sets'],
    memberships: ['Compare plans', 'Benefits', 'Join now']
  };
  
  return suggestions[page] || suggestions.home;
}

// Check rate limit
export function isRateLimited(identifier: string): boolean {
  return !checkRateLimit(identifier);
}
