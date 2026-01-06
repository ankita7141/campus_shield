// Google Natural Language API integration
// Note: This requires Google Cloud credentials

const axios = require('axios');

// Mock implementation for development
// In production, use actual Google NLP API

exports.analyzeText = async (text) => {
  try {
    // Mock analysis - replace with actual Google NLP API call
    const categories = detectCategories(text);
    const sentiment = analyzeSentiment(text);
    const entities = extractEntities(text);
    
    return {
      success: true,
      categories,
      sentiment,
      entities,
      language: 'en'
    };
  } catch (error) {
    console.error('NLP Analysis Error:', error);
    return {
      success: false,
      categories: ['other'],
      sentiment: 0,
      entities: [],
      language: 'en'
    };
  }
};

// Helper functions for mock analysis
function detectCategories(text) {
  const categories = [];
  const lowerText = text.toLowerCase();
  
  // Detect harassment
  if (lowerText.includes('harass') || lowerText.includes('abuse') || 
      lowerText.includes('threat') || lowerText.includes('stalk')) {
    categories.push('harassment');
  }
  
  // Detect safety threat
  if (lowerText.includes('weapon') || lowerText.includes('knife') || 
      lowerText.includes('gun') || lowerText.includes('attack') ||
      lowerText.includes('danger') || lowerText.includes('unsafe')) {
    categories.push('safety-threat');
  }
  
  // Detect misbehavior
  if (lowerText.includes('fight') || lowerText.includes('drunk') ||
      lowerText.includes('vandal') || lowerText.includes('disrupt')) {
    categories.push('misbehavior');
  }
  
  // Detect emergency
  if (lowerText.includes('emergency') || lowerText.includes('urgent') ||
      lowerText.includes('help') || lowerText.includes('immediate') ||
      lowerText.includes('accident') || lowerText.includes('injury')) {
    categories.push('emergency');
  }
  
  // Default category
  if (categories.length === 0) {
    categories.push('other');
  }
  
  return categories;
}

function analyzeSentiment(text) {
  const lowerText = text.toLowerCase();
  let score = 0;
  
  // Simple sentiment analysis
  const positiveWords = ['help', 'support', 'safe', 'protected', 'resolved', 'good'];
  const negativeWords = ['danger', 'threat', 'fear', 'scared', 'unsafe', 'bad', 'hurt'];
  
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) score += 0.1;
  });
  
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) score -= 0.1;
  });
  
  // Normalize between -1 and 1
  return Math.max(-1, Math.min(1, score));
}

function extractEntities(text) {
  // Simple entity extraction
  const entities = [];
  const words = text.split(' ');
  
  // Look for locations
  const locationKeywords = ['room', 'hall', 'building', 'hostel', 'cafeteria', 'library', 'gate'];
  words.forEach((word, index) => {
    if (locationKeywords.some(keyword => word.toLowerCase().includes(keyword))) {
      entities.push({
        name: words.slice(Math.max(0, index - 2), index + 3).join(' '),
        type: 'LOCATION'
      });
    }
  });
  
  // Look for time references
  const timePatterns = [
    /\d{1,2}[:.]\d{2}\s*(am|pm)?/i,
    /\d{1,2}\s*(am|pm)/i,
    /morning|afternoon|evening|night|midnight/i
  ];
  
  timePatterns.forEach(pattern => {
    const match = text.match(pattern);
    if (match) {
      entities.push({
        name: match[0],
        type: 'TIME'
      });
    }
  });
  
  return entities;
}