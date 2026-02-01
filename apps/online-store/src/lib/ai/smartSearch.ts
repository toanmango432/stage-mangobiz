import { AISearchSuggestion } from "@/types/ai";
import { Service, Product } from "@/types/catalog";

export function getSmartSearchSuggestions(
  query: string,
  services: Service[],
  products: Product[]
): AISearchSuggestion[] {
  const suggestions: AISearchSuggestion[] = [];
  const lowerQuery = query.toLowerCase();

  // Time slot detection
  const timeMatch = lowerQuery.match(/(\d{1,2})\s*(am|pm|:)/i);
  if (timeMatch) {
    suggestions.push({
      query: `Available appointments near ${timeMatch[0]}`,
      type: 'time',
      confidence: 0.9,
    });
  }

  // Service search
  services.forEach(service => {
    const score = calculateSearchScore(lowerQuery, service.name, service.description);
    if (score > 0.3) {
      suggestions.push({
        query: service.name,
        type: 'service',
        confidence: score,
        result: service as unknown as Record<string, unknown>,
      });
    }
  });

  // Product search
  products.forEach(product => {
    const score = calculateSearchScore(lowerQuery, product.name, product.description);
    if (score > 0.3) {
      suggestions.push({
        query: product.name,
        type: 'product',
        confidence: score,
        result: product as unknown as Record<string, unknown>,
      });
    }
  });

  return suggestions
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);
}

export function parseNaturalLanguageQuery(query: string): {
  intent: string;
  entities: Record<string, any>;
} {
  const lowerQuery = query.toLowerCase();
  
  // Intent detection
  let intent = 'search';
  if (lowerQuery.includes('book') || lowerQuery.includes('appointment')) {
    intent = 'booking';
  } else if (lowerQuery.includes('buy') || lowerQuery.includes('purchase')) {
    intent = 'purchase';
  }

  // Entity extraction
  const entities: Record<string, any> = {};

  // Time extraction
  const timeMatch = lowerQuery.match(/(\d{1,2})\s*(am|pm)/i);
  if (timeMatch) {
    entities.time = timeMatch[0];
  }

  // Date extraction
  if (lowerQuery.includes('today')) entities.date = 'today';
  if (lowerQuery.includes('tomorrow')) entities.date = 'tomorrow';
  if (lowerQuery.match(/\d{1,2}\/\d{1,2}/)) {
    entities.date = lowerQuery.match(/\d{1,2}\/\d{1,2}/)?.[0];
  }

  // Service type extraction
  const serviceTypes = ['manicure', 'pedicure', 'waxing', 'facial', 'massage'];
  serviceTypes.forEach(type => {
    if (lowerQuery.includes(type)) {
      entities.serviceType = type;
    }
  });

  return { intent, entities };
}

function calculateSearchScore(query: string, name: string, description: string): number {
  let score = 0;
  const nameLower = name.toLowerCase();
  const descLower = description.toLowerCase();

  // Exact match
  if (nameLower.includes(query)) {
    score += 1.0;
  }

  // Partial match in name
  const nameWords = nameLower.split(' ');
  const queryWords = query.split(' ');
  
  queryWords.forEach(qWord => {
    if (nameWords.some(nWord => nWord.includes(qWord) || qWord.includes(nWord))) {
      score += 0.5;
    }
  });

  // Match in description
  if (descLower.includes(query)) {
    score += 0.3;
  }

  // Fuzzy matching (simple Levenshtein-like)
  const similarity = calculateStringSimilarity(query, nameLower);
  score += similarity * 0.5;

  return Math.min(score, 1.0);
}

function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}
