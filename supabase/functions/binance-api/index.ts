import { createHmac } from "node:crypto";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get API keys from environment secrets
    const apiKey = Deno.env.get('BINANCE_API_KEY');
    const apiSecret = Deno.env.get('BINANCE_SECRET_KEY');

    if (!apiKey || !apiSecret) {
      console.warn('Using fallback: Binance API credentials not configured in environment');
      // For public endpoints, we can continue without API key
    }

    const url = new URL(req.url);
    const endpoint = url.searchParams.get('endpoint') || 'ticker/24hr';
    const symbol = url.searchParams.get('symbol');

    let apiUrl = `https://api.binance.com/api/v3/${endpoint}`;
    
    if (symbol) {
      apiUrl += `?symbol=${symbol}`;
    }

    // For public endpoints, no signature required
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['X-MBX-APIKEY'] = apiKey;
    }

    const response = await fetch(apiUrl, { headers });

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Binance API error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});