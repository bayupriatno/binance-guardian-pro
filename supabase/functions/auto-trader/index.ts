import { createHmac } from "node:crypto";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TradeSignal {
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price?: number;
  type: 'MARKET' | 'LIMIT';
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
  userId: string;
  botId?: string;
  stopLossPercent?: number;
  takeProfitPercent?: number;
}

interface BinanceOrderResponse {
  symbol: string;
  orderId: number;
  orderListId: number;
  clientOrderId: string;
  transactTime: number;
  price: string;
  origQty: string;
  executedQty: string;
  cummulativeQuoteQty: string;
  status: string;
  timeInForce: string;
  type: string;
  side: string;
  fills: Array<{
    price: string;
    qty: string;
    commission: string;
    commissionAsset: string;
  }>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    // Create Supabase client for server-side operations
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, ...payload } = await req.json();

    switch (action) {
      case 'execute_trade':
        return await executeTrade(supabase, payload as TradeSignal);
      case 'check_tp_sl':
        return await checkTakeProfitStopLoss(supabase, payload.userId);
      case 'get_account_info':
        return await getAccountInfo(supabase, payload.userId);
      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Auto trader error:', error);
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

async function executeTrade(supabase: any, signal: TradeSignal) {
  console.log('Executing trade signal:', signal);

  // Get user settings and API keys
  const { data: userSettings, error: settingsError } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', signal.userId)
    .single();

  if (settingsError || !userSettings) {
    throw new Error('User settings not found');
  }

  if (!userSettings.auto_trading_enabled) {
    throw new Error('Auto trading is disabled for this user');
  }

  if (!userSettings.binance_api_key || !userSettings.binance_secret_key) {
    throw new Error('Binance API credentials not configured');
  }

  // Check daily trade limit
  const today = new Date().toISOString().split('T')[0];
  const { data: todayTrades, error: tradesError } = await supabase
    .from('orders')
    .select('id')
    .eq('user_id', signal.userId)
    .gte('created_at', `${today}T00:00:00.000Z`)
    .lt('created_at', `${today}T23:59:59.999Z`);

  if (tradesError) {
    console.error('Error checking daily trades:', tradesError);
  }

  if (todayTrades && todayTrades.length >= userSettings.max_daily_trades) {
    throw new Error('Daily trade limit reached');
  }

  // Check position size limit
  const tradeValue = signal.quantity * (signal.price || 0);
  if (tradeValue > userSettings.max_position_size) {
    throw new Error('Trade size exceeds maximum position size');
  }

  // Generate signature for Binance API
  const timestamp = Date.now();
  const queryString = `symbol=${signal.symbol}&side=${signal.side}&type=${signal.type}&quantity=${signal.quantity}&timestamp=${timestamp}`;
  
  if (signal.price && signal.type === 'LIMIT') {
    queryString += `&price=${signal.price}&timeInForce=${signal.timeInForce || 'GTC'}`;
  }

  const signature = createHmac('sha256', userSettings.binance_secret_key)
    .update(queryString)
    .digest('hex');

  // Execute trade on Binance
  const binanceResponse = await fetch('https://api.binance.com/api/v3/order', {
    method: 'POST',
    headers: {
      'X-MBX-APIKEY': userSettings.binance_api_key,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `${queryString}&signature=${signature}`,
  });

  if (!binanceResponse.ok) {
    const errorText = await binanceResponse.text();
    console.error('Binance API error:', errorText);
    throw new Error(`Binance API error: ${binanceResponse.status} ${errorText}`);
  }

  const binanceOrder: BinanceOrderResponse = await binanceResponse.json();
  console.log('Binance order response:', binanceOrder);

  // Calculate TP/SL prices if auto TP/SL is enabled
  let stopLossPrice = null;
  let takeProfitPrice = null;
  
  if (userSettings.auto_tp_sl_enabled && binanceOrder.fills && binanceOrder.fills.length > 0) {
    const avgPrice = parseFloat(binanceOrder.fills[0].price);
    const slPercent = signal.stopLossPercent || userSettings.default_stop_loss_percent;
    const tpPercent = signal.takeProfitPercent || userSettings.default_take_profit_percent;
    
    if (signal.side === 'BUY') {
      stopLossPrice = avgPrice * (1 - slPercent / 100);
      takeProfitPrice = avgPrice * (1 + tpPercent / 100);
    } else {
      stopLossPrice = avgPrice * (1 + slPercent / 100);
      takeProfitPrice = avgPrice * (1 - tpPercent / 100);
    }
  }

  // Save order to database
  const orderData = {
    user_id: signal.userId,
    bot_id: signal.botId,
    symbol: binanceOrder.symbol,
    side: binanceOrder.side,
    type: binanceOrder.type,
    quantity: parseFloat(binanceOrder.origQty),
    price: binanceOrder.price ? parseFloat(binanceOrder.price) : null,
    filled_quantity: parseFloat(binanceOrder.executedQty),
    avg_fill_price: binanceOrder.fills && binanceOrder.fills.length > 0 ? parseFloat(binanceOrder.fills[0].price) : null,
    status: binanceOrder.status.toLowerCase(),
    order_id: binanceOrder.orderId.toString(),
    time_in_force: binanceOrder.timeInForce,
    commission: binanceOrder.fills && binanceOrder.fills.length > 0 ? parseFloat(binanceOrder.fills[0].commission) : 0,
    executed_at: binanceOrder.status === 'FILLED' ? new Date().toISOString() : null,
    stop_loss_price: stopLossPrice,
    take_profit_price: takeProfitPrice,
    auto_tp_sl_enabled: userSettings.auto_tp_sl_enabled
  };

  const { data: savedOrder, error: orderError } = await supabase
    .from('orders')
    .insert(orderData)
    .select()
    .single();

  if (orderError) {
    console.error('Error saving order:', orderError);
    throw new Error('Failed to save order to database');
  }

  // If auto TP/SL is enabled and order is filled, place TP/SL orders
  if (userSettings.auto_tp_sl_enabled && binanceOrder.status === 'FILLED' && stopLossPrice && takeProfitPrice) {
    try {
      await placeTPSLOrders(userSettings, binanceOrder, stopLossPrice, takeProfitPrice);
    } catch (tpslError) {
      console.error('Error placing TP/SL orders:', tpslError);
      // Continue execution even if TP/SL placement fails
    }
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      order: savedOrder,
      binanceOrder,
      tpSlEnabled: userSettings.auto_tp_sl_enabled,
      stopLossPrice,
      takeProfitPrice
    }),
    {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    }
  );
}

async function placeTPSLOrders(userSettings: any, originalOrder: BinanceOrderResponse, stopLossPrice: number, takeProfitPrice: number) {
  const quantity = originalOrder.executedQty;
  const symbol = originalOrder.symbol;
  const originalSide = originalOrder.side;
  
  // Determine TP/SL sides (opposite of original order)
  const tpSide = originalSide === 'BUY' ? 'SELL' : 'BUY';
  const slSide = originalSide === 'BUY' ? 'SELL' : 'BUY';

  // Place Take Profit order (LIMIT)
  const tpTimestamp = Date.now();
  const tpQueryString = `symbol=${symbol}&side=${tpSide}&type=LIMIT&quantity=${quantity}&price=${takeProfitPrice}&timeInForce=GTC&timestamp=${tpTimestamp}`;
  const tpSignature = createHmac('sha256', userSettings.binance_secret_key)
    .update(tpQueryString)
    .digest('hex');

  await fetch('https://api.binance.com/api/v3/order', {
    method: 'POST',
    headers: {
      'X-MBX-APIKEY': userSettings.binance_api_key,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `${tpQueryString}&signature=${tpSignature}`,
  });

  // Place Stop Loss order (STOP_MARKET)
  const slTimestamp = Date.now();
  const slQueryString = `symbol=${symbol}&side=${slSide}&type=STOP_MARKET&quantity=${quantity}&stopPrice=${stopLossPrice}&timestamp=${slTimestamp}`;
  const slSignature = createHmac('sha256', userSettings.binance_secret_key)
    .update(slQueryString)
    .digest('hex');

  await fetch('https://api.binance.com/api/v3/order', {
    method: 'POST',
    headers: {
      'X-MBX-APIKEY': userSettings.binance_api_key,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `${slQueryString}&signature=${slSignature}`,
  });
}

async function checkTakeProfitStopLoss(supabase: any, userId: string) {
  // Get user settings
  const { data: userSettings, error: settingsError } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (settingsError || !userSettings || !userSettings.auto_tp_sl_enabled) {
    return new Response(
      JSON.stringify({ message: 'Auto TP/SL not enabled' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Get open positions with TP/SL enabled
  const { data: positions, error: positionsError } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'filled')
    .eq('auto_tp_sl_enabled', true)
    .not('stop_loss_price', 'is', null)
    .not('take_profit_price', 'is', null);

  if (positionsError) {
    throw new Error('Failed to fetch positions');
  }

  const results = [];
  for (const position of positions || []) {
    try {
      // Get current price from Binance
      const priceResponse = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${position.symbol}`);
      const priceData = await priceResponse.json();
      const currentPrice = parseFloat(priceData.price);

      let shouldTrigger = false;
      let triggerType = '';

      // Check if TP/SL should trigger
      if (position.side === 'BUY') {
        if (currentPrice <= position.stop_loss_price) {
          shouldTrigger = true;
          triggerType = 'STOP_LOSS';
        } else if (currentPrice >= position.take_profit_price) {
          shouldTrigger = true;
          triggerType = 'TAKE_PROFIT';
        }
      } else {
        if (currentPrice >= position.stop_loss_price) {
          shouldTrigger = true;
          triggerType = 'STOP_LOSS';
        } else if (currentPrice <= position.take_profit_price) {
          shouldTrigger = true;
          triggerType = 'TAKE_PROFIT';
        }
      }

      if (shouldTrigger) {
        // Execute closing trade
        const closeSignal: TradeSignal = {
          symbol: position.symbol,
          side: position.side === 'BUY' ? 'SELL' : 'BUY',
          quantity: position.filled_quantity,
          type: 'MARKET',
          userId: userId,
          botId: position.bot_id
        };

        const closeResult = await executeTrade(supabase, closeSignal);
        results.push({
          position: position.id,
          triggerType,
          currentPrice,
          closeResult
        });
      }
    } catch (error) {
      console.error(`Error processing position ${position.id}:`, error);
      results.push({
        position: position.id,
        error: error.message
      });
    }
  }

  return new Response(
    JSON.stringify({ results }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getAccountInfo(supabase: any, userId: string) {
  const { data: userSettings, error: settingsError } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (settingsError || !userSettings) {
    throw new Error('User settings not found');
  }

  if (!userSettings.binance_api_key || !userSettings.binance_secret_key) {
    throw new Error('Binance API credentials not configured');
  }

  const timestamp = Date.now();
  const queryString = `timestamp=${timestamp}`;
  const signature = createHmac('sha256', userSettings.binance_secret_key)
    .update(queryString)
    .digest('hex');

  const accountResponse = await fetch(`https://api.binance.com/api/v3/account?${queryString}&signature=${signature}`, {
    headers: {
      'X-MBX-APIKEY': userSettings.binance_api_key,
    },
  });

  if (!accountResponse.ok) {
    throw new Error(`Binance API error: ${accountResponse.status}`);
  }

  const accountData = await accountResponse.json();

  return new Response(
    JSON.stringify(accountData),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}