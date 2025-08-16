import { NextRequest, NextResponse } from 'next/server';

interface Product {
  name: string;
  price: number;
  category: string;
  stockQuantity: number;
  description: string;
}

// Validate required environment variables
if (!process.env.GEMMA_API_KEY) {
  throw new Error('GEMMA_API_KEY environment variable is required');
}

const GEMMA_API_KEY = process.env.GEMMA_API_KEY;
const GEMMA_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function POST(request: NextRequest) {
  try {
    const { message, context, products, currentProducts, searchQuery } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Create product context for the AI
    let productContext = '';
    if (products && products.length > 0) {
      // If user is asking about a specific product, prioritize matching products
      let relevantProducts = products;
      if (searchQuery) {
        const queryTerms = searchQuery.split(' ').filter((term: string) => term.length > 2);
        relevantProducts = products.filter((p: Product) => 
          queryTerms.some((term: string) => 
            p.name.toLowerCase().includes(term) || 
            p.description.toLowerCase().includes(term) ||
            p.category.toLowerCase().includes(term)
          )
        );
        
        // If no exact matches, provide a helpful response
        if (relevantProducts.length === 0) {
          relevantProducts = products; // Show all products when no match found
          productContext = `\n\nUser is asking about: "${searchQuery}"\nNo exact product found with that name. Here are our available products:\n`;
        } else {
          productContext = `\n\nUser is asking about: "${searchQuery}"\nRelevant products found:\n`;
        }
      } else {
        productContext = `\n\nCurrent Products Available:\n`;
      }
      
      productContext += `${relevantProducts.map((p: Product) => 
        `- ${p.name}: $${p.price.toFixed(2)} (${p.category}, Stock: ${p.stockQuantity})`
      ).join('\n')}\n\nTotal Products: ${currentProducts || products.length}`;
    }

    const systemPrompt = `You are a helpful customer service assistant for KKG E-Commerce, an online store specializing in Electronics. 

Context: ${context || 'KKG E-Commerce - specializing in Technology products.'}

Your role:
- Help customers with product inquiries about Electronics
- Provide information about features, pricing, and availability using the current product data
- When customers ask about specific products, search through the provided product list and give detailed information
- If a product name is mentioned (like "Dragon"), search for it in the product list and provide information
- If no exact match is found, simply state that the product is not available and list some similar products from our inventory
- Do not ask for clarification or suggest they provide more context - just be direct and helpful
- Assist with general shopping questions
- Direct customers to contact support for complex issues
- Be friendly, professional, and concise
- If asked about products not in our categories, politely redirect to our specialties
- For technical issues or specific order questions, suggest contacting support directly
- Use the product information provided to give accurate, up-to-date responses

Owner contact:
- Côte d'Ivoire: +225 07 87 94 22 88 (WhatsApp)
- India: +91 99018 84675 (WhatsApp)
- Email: kouadioguillaumek287@gmail.com

Keep responses helpful but brief (under 150 words when possible).

${productContext}`;

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
            content: systemPrompt && context
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemma API error: ${response.status}`);
    }

    const data = await response.json();
    const botResponse = data.choices?.[0]?.message?.content || 'I apologize, but I\'m having trouble processing your request right now. Please try again or contact our support team directly.';

    return NextResponse.json({ response: botResponse });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ 
      response: 'I\'m sorry, I\'m experiencing technical difficulties. Please contact our support team at +225 07 87 94 22 88 (WhatsApp) or kouadioguillaumek287@gmail.com for assistance.' 
    }, { status: 500 });
  }
}
