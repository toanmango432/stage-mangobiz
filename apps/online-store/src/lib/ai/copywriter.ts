// AI Copywriting using external AI Service
import { aiAPI } from '@/lib/api-client/clients';
import type { AIChatRequest, AIChatResponse, UserContext } from '@/types/api/ai';

export interface CopywritingRequest {
  type: 'promotion' | 'announcement' | 'service' | 'brand' | 'cta' | 'headline';
  context: string;
  tone?: 'professional' | 'friendly' | 'urgent' | 'casual' | 'luxury';
  length?: 'short' | 'medium' | 'long';
  targetAudience?: string;
  businessName?: string;
  serviceType?: string;
  additionalInfo?: string;
}

export interface CopywritingResult {
  id: string;
  type: string;
  content: string;
  tone: string;
  length: string;
  createdAt: string;
  rating?: number;
}

class AICopywriter {
  private async generateWithAIService(prompt: string): Promise<string> {
    try {
      // Check if we're in standalone mode
      const isStandalone = typeof __MODE__ !== 'undefined' && __MODE__ === 'standalone';
      
      if (isStandalone) {
        // Use mock responses in standalone mode
        return this.getMockResponse(prompt);
      }

      // Use external AI Service in connected mode
      const request: AIChatRequest = {
        sessionId: `copywriter-${Date.now()}`,
        message: prompt,
        context: {
          page: 'admin/copywriter',
          user: { id: 'admin' }
        }
      };

      const response = await aiAPI.post('/chat', request);

      if (response.success && response.data) {
        const chatResponse = response.data as AIChatResponse;
        return chatResponse.response;
      } else {
        console.error('AI Service error:', response.error);
        return this.getMockResponse(prompt);
      }
    } catch (error) {
      console.error('AI copywriting error:', error);
      return this.getMockResponse(prompt);
    }
  }

  private getMockResponse(prompt: string): string {
    // Enhanced mock responses based on prompt content
    const mockResponses = {
      promotion: [
        "Transform your look with our premium beauty services!",
        "Discover the perfect style that matches your personality.",
        "Experience luxury beauty treatments in a relaxing environment.",
        "Book your appointment today and see the difference!",
        "Join thousands of satisfied customers who trust our expertise."
      ],
      announcement: [
        "We're excited to announce our new services and extended hours!",
        "Important update: We're implementing new safety protocols.",
        "Thank you for your continued support and trust in our services.",
        "We're thrilled to share some exciting news with our valued clients.",
        "Stay tuned for amazing updates coming your way!"
      ],
      service: [
        "Experience the ultimate in beauty and relaxation with our expert services.",
        "Transform your look with our professional stylists and premium products.",
        "Discover personalized beauty solutions tailored just for you.",
        "Indulge in luxury treatments that leave you feeling refreshed and confident.",
        "Book now and experience the difference our expertise makes."
      ],
      brand: [
        "Where beauty meets excellence, every visit is a transformation.",
        "Your trusted partner in beauty, style, and self-confidence.",
        "Luxury beauty services that celebrate your unique style.",
        "Experience the art of beauty with our skilled professionals.",
        "Where every client is treated like royalty."
      ],
      cta: [
        "Book Now",
        "Get Started",
        "Learn More",
        "Discover More",
        "Reserve Your Spot"
      ],
      headline: [
        "Transform Your Look Today",
        "Discover Your Perfect Style",
        "Luxury Beauty Services",
        "Expert Care, Beautiful Results",
        "Your Beauty Journey Starts Here"
      ]
    };

    // Determine response type based on prompt content
    let responseType = 'promotion';
    if (prompt.toLowerCase().includes('announcement')) responseType = 'announcement';
    else if (prompt.toLowerCase().includes('service')) responseType = 'service';
    else if (prompt.toLowerCase().includes('brand') || prompt.toLowerCase().includes('tagline')) responseType = 'brand';
    else if (prompt.toLowerCase().includes('call-to-action') || prompt.toLowerCase().includes('cta')) responseType = 'cta';
    else if (prompt.toLowerCase().includes('headline')) responseType = 'headline';

    const responses = mockResponses[responseType as keyof typeof mockResponses] || mockResponses.promotion;
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private getPrompt(request: CopywritingRequest): string {
    const { type, context, tone = 'professional', length = 'medium', targetAudience, businessName, serviceType, additionalInfo } = request;

    const toneInstructions = {
      professional: 'Use a professional, trustworthy tone',
      friendly: 'Use a warm, approachable tone',
      urgent: 'Create urgency and excitement',
      casual: 'Use a relaxed, conversational tone',
      luxury: 'Use an elegant, premium tone'
    };

    const lengthInstructions = {
      short: 'Keep it concise (1-2 sentences)',
      medium: 'Use 2-4 sentences',
      long: 'Provide detailed information (4-6 sentences)'
    };

    const basePrompt = `You are an expert copywriter for a beauty salon business. ${toneInstructions[tone]}. ${lengthInstructions[length]}.

Context: ${context}
${businessName ? `Business Name: ${businessName}` : ''}
${serviceType ? `Service Type: ${serviceType}` : ''}
${targetAudience ? `Target Audience: ${targetAudience}` : ''}
${additionalInfo ? `Additional Info: ${additionalInfo}` : ''}

Generate compelling copy for:`;

    switch (type) {
      case 'promotion':
        return `${basePrompt} a promotional offer or discount announcement. Include a clear call-to-action and create excitement about the offer.`;

      case 'announcement':
        return `${basePrompt} a business announcement (new services, hours, policies, etc.). Be informative and engaging.`;

      case 'service':
        return `${basePrompt} a service description that highlights benefits and encourages bookings. Focus on what makes this service special.`;

      case 'brand':
        return `${basePrompt} brand messaging (tagline, mission statement, value proposition). Capture the essence of the salon's personality.`;

      case 'cta':
        return `${basePrompt} a call-to-action button or link text. Make it action-oriented and compelling.`;

      case 'headline':
        return `${basePrompt} a page or section headline. Make it attention-grabbing and relevant.`;

      default:
        return `${basePrompt} marketing content that resonates with beauty salon clients.`;
    }
  }

  async generateCopy(request: CopywritingRequest): Promise<CopywritingResult> {
    const prompt = this.getPrompt(request);
    const content = await this.generateWithAIService(prompt);

    return {
      id: `copy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: request.type,
      content: content.trim(),
      tone: request.tone || 'professional',
      length: request.length || 'medium',
      createdAt: new Date().toISOString()
    };
  }

  async generateMultipleOptions(request: CopywritingRequest, count: number = 3): Promise<CopywritingResult[]> {
    const promises = Array.from({ length: count }, () => this.generateCopy(request));
    return Promise.all(promises);
  }

  async generateForPromotion(promotionData: {
    title: string;
    description: string;
    discount?: string;
    validUntil?: string;
    businessName?: string;
  }): Promise<CopywritingResult[]> {
    const context = `Promotion: ${promotionData.title} - ${promotionData.description}${promotionData.discount ? ` (${promotionData.discount} off)` : ''}${promotionData.validUntil ? ` (Valid until ${promotionData.validUntil})` : ''}`;
    
    return this.generateMultipleOptions({
      type: 'promotion',
      context,
      businessName: promotionData.businessName,
      tone: 'urgent',
      length: 'medium'
    });
  }

  async generateForAnnouncement(announcementData: {
    title: string;
    content: string;
    category: string;
    businessName?: string;
  }): Promise<CopywritingResult[]> {
    const context = `${announcementData.category}: ${announcementData.title} - ${announcementData.content}`;
    
    return this.generateMultipleOptions({
      type: 'announcement',
      context,
      businessName: announcementData.businessName,
      tone: 'professional',
      length: 'medium'
    });
  }

  async generateForService(serviceData: {
    name: string;
    description: string;
    duration?: string;
    price?: string;
    businessName?: string;
  }): Promise<CopywritingResult[]> {
    const context = `Service: ${serviceData.name} - ${serviceData.description}${serviceData.duration ? ` (${serviceData.duration})` : ''}${serviceData.price ? ` ($${serviceData.price})` : ''}`;
    
    return this.generateMultipleOptions({
      type: 'service',
      context,
      businessName: serviceData.businessName,
      tone: 'professional',
      length: 'medium'
    });
  }

  async generateHeadlines(pageType: string, context: string, businessName?: string): Promise<CopywritingResult[]> {
    return this.generateMultipleOptions({
      type: 'headline',
      context: `${pageType} page: ${context}`,
      businessName,
      tone: 'professional',
      length: 'short'
    });
  }

  async generateCTAs(action: string, context: string): Promise<CopywritingResult[]> {
    return this.generateMultipleOptions({
      type: 'cta',
      context: `Call-to-action for: ${action} - ${context}`,
      tone: 'urgent',
      length: 'short'
    });
  }
}

// Export singleton instance
export const aiCopywriter = new AICopywriter();
