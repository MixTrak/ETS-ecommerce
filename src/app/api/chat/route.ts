import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongo';
import Product from '@/models/Product';

// Validate required environment variables
if (!process.env.GEMMA_API_KEY) {
  throw new Error('GEMMA_API_KEY environment variable is required');
}

const GEMMA_API_KEY = process.env.GEMMA_API_KEY;
const GEMMA_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface ProductData {
  _id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  tags: string[];
  stockQuantity: number;
  sku: string;
  featured: boolean;
  isActive: boolean;
}



// Product matching and search functions
function findRelevantProducts(products: ProductData[], userMessage: string): ProductData[] {
  const message = userMessage.toLowerCase();
  const words = message.split(/\s+/).filter(word => word.length > 2);
  
  // Scoring system for product relevance
  const scoredProducts = products.map(product => {
    let score = 0;
    
    // Exact name match (highest priority)
    if (message.includes(product.name.toLowerCase())) {
      score += 100;
    }
    
    // Partial name match
    if (words.some(word => product.name.toLowerCase().includes(word))) {
      score += 50;
    }
    
    // Category match
    if (message.includes(product.category.toLowerCase())) {
      score += 30;
    }
    
    // Tag matches
    product.tags.forEach(tag => {
      if (message.includes(tag.toLowerCase())) {
        score += 20;
      }
    });
    
    // Description keyword matches
    const descriptionWords = product.description.toLowerCase().split(/\s+/);
    words.forEach(word => {
      if (descriptionWords.includes(word)) {
        score += 10;
      }
    });
    
    // Price range queries
    const priceMatch = message.match(/(\d+)\s*(?:dollars?|usd|\$)/i);
    if (priceMatch) {
      const targetPrice = parseInt(priceMatch[1]);
      if (Math.abs(product.price - targetPrice) <= 50) {
        score += 15;
      }
    }
    
    // Stock availability queries
    if (message.includes('available') || message.includes('stock') || message.includes('in stock')) {
      if (product.stockQuantity > 0) {
        score += 5;
      }
    }
    
    return { product, score };
  });
  
  // Filter and sort by relevance score
  return scoredProducts
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.product);
}

function generateProductContext(products: ProductData[], relevantProducts: ProductData[]): string {
  let context = '';
  
  if (relevantProducts.length > 0) {
    context += `\n\nRelevant products found for your query:\n`;
    relevantProducts.slice(0, 5).forEach(product => {
      context += `• ${product.name} - $${product.price.toFixed(2)} (${product.category})\n`;
      context += `  Stock: ${product.stockQuantity > 0 ? `${product.stockQuantity} available` : 'Out of stock'}\n`;
      context += `  SKU: ${product.sku}\n`;
      if (product.featured) {
        context += `  ⭐ Featured Product\n`;
      }
      context += `  Description: ${product.description.substring(0, 100)}${product.description.length > 100 ? '...' : ''}\n\n`;
    });
  } else {
    context += `\n\nAvailable product categories:\n`;
    const categories = [...new Set(products.map(p => p.category))];
    context += categories.map(cat => `• ${cat}`).join('\n');
    context += `\n\nTotal products available: ${products.length}`;
  }
  
  return context;
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Valid message is required' }, { status: 400 });
    }

    // Connect to database and fetch all active products
    await connectDB();
    const products = (await Product.find({ isActive: true })
      .select('name price description category tags stockQuantity sku featured isActive')
      .lean()) as unknown as ProductData[];

    if (!products || products.length === 0) {
      return NextResponse.json({ 
        response: "I'm sorry, but I don't have access to our product catalog at the moment. Please contact our support team for assistance." 
      });
    }

    // Find relevant products based on user message
    const relevantProducts = findRelevantProducts(products, message);
    const productContext = generateProductContext(products, relevantProducts);

    // Determine response type based on user intent
    let responseType = 'general';
    const messageLower = message.toLowerCase();
    
    if (messageLower.includes('price') || messageLower.includes('cost') || messageLower.includes('how much')) {
      responseType = 'pricing';
    } else if (messageLower.includes('stock') || messageLower.includes('available') || messageLower.includes('in stock')) {
      responseType = 'availability';
    } else if (messageLower.includes('feature') || messageLower.includes('spec') || messageLower.includes('detail')) {
      responseType = 'features';
    } else if (messageLower.includes('buy') || messageLower.includes('purchase') || messageLower.includes('order')) {
      responseType = 'purchase';
    } else if (relevantProducts.length > 0) {
      responseType = 'product_info';
    }

    const systemPrompt = `You are an intelligent customer service assistant for ETS E-Commerce, specializing in Electronics and Technology products.

Your capabilities:
- Provide detailed information about products based on user queries
- Answer questions about pricing, availability, and features
- Help customers find the right products for their needs
- Provide accurate stock information and pricing
- Guide customers through the purchasing process
- Be friendly, professional, and helpful

Response guidelines:
- Keep responses concise but informative (50-150 words)
- Always mention specific product names, prices, and stock levels when relevant
- If a product is out of stock, suggest alternatives
- For pricing questions, always include the exact price
- For availability questions, clearly state stock status
- If no specific product matches, suggest similar products or categories
- Direct complex issues to support
- Avoid overly technical jargon; explain simply
- Do not fabricate information; if unsure, admit it and suggest contacting support
- Do not surround text with '**' or similar characters for emphasis
- When customer Asks for recommendations, suggest top 2-3 Featured products with brief reasons
- When customer asks about products look through the catalog and suggest up to 3 relevant products with prices and stock status

Contact Information:
- WhatsApp (Côte d'Ivoire): +2250505308277
- Email: Kouakoujohnsonyao2@gmail.com

Current product catalog:${productContext}

User query type: ${responseType}
User message: "${message}"

Provide a helpful, accurate response based on the product information above.`;

    const response = await fetch(GEMMA_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GEMMA_API_KEY}`,
        'HTTP-Referer': 'https://kkg-ecommerce.vercel.app',
        'X-Title': 'KKG E-Commerce Assistant',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemma-2-9b-it:free',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 400,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemma API error:', response.status, errorText);
      throw new Error(`Gemma API error: ${response.status}`);
    }

    const data = await response.json();
    const botResponse = data.choices?.[0]?.message?.content || 
      'I apologize, but I\'m having trouble processing your request right now. Please try again or contact our support team directly.';

    return NextResponse.json({ 
      response: botResponse,
      relevantProducts: relevantProducts.slice(0, 3).map(p => ({
        id: p._id,
        name: p.name,
        price: p.price,
        category: p.category,
        stockQuantity: p.stockQuantity,
        sku: p.sku
      }))
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ 
      response: 'I\'m sorry, I\'m experiencing technical difficulties. Please contact our support team at +2250505308277 (WhatsApp) or Kouakoujohnsonyao2@gmail.com for assistance.' 
    }, { status: 500 });
  }
}
