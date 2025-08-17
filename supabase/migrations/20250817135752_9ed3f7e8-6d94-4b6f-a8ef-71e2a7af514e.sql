-- Create orders table for order management
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  type TEXT NOT NULL CHECK (type IN ('market', 'limit', 'stop_loss', 'take_profit')),
  quantity NUMERIC NOT NULL,
  price NUMERIC,
  stop_price NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'cancelled', 'rejected')),
  time_in_force TEXT DEFAULT 'GTC' CHECK (time_in_force IN ('GTC', 'IOC', 'FOK')),
  filled_quantity NUMERIC DEFAULT 0,
  avg_fill_price NUMERIC,
  bot_id UUID,
  order_id TEXT,
  commission NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  executed_at TIMESTAMP WITH TIME ZONE
);

-- Create alerts table for price and strategy alerts
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('price', 'volume', 'bot_status', 'pnl')),
  symbol TEXT,
  condition_type TEXT NOT NULL CHECK (condition_type IN ('above', 'below', 'equals', 'percentage_change')),
  target_value NUMERIC NOT NULL,
  current_value NUMERIC,
  triggered BOOLEAN DEFAULT FALSE,
  enabled BOOLEAN DEFAULT TRUE,
  title TEXT NOT NULL,
  message TEXT,
  bot_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  triggered_at TIMESTAMP WITH TIME ZONE
);

-- Create trading strategies table for automated strategies
CREATE TABLE public.trading_strategies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  strategy_type TEXT NOT NULL CHECK (strategy_type IN ('dca', 'grid', 'momentum', 'arbitrage', 'scalping')),
  config JSONB NOT NULL DEFAULT '{}',
  active BOOLEAN DEFAULT FALSE,
  performance JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_strategies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for orders
CREATE POLICY "Users can manage their own orders" 
ON public.orders 
FOR ALL 
USING (auth.uid() = user_id);

-- Create RLS policies for alerts
CREATE POLICY "Users can manage their own alerts" 
ON public.alerts 
FOR ALL 
USING (auth.uid() = user_id);

-- Create RLS policies for trading strategies
CREATE POLICY "Users can manage their own strategies" 
ON public.trading_strategies 
FOR ALL 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates on orders
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for automatic timestamp updates on trading strategies
CREATE TRIGGER update_trading_strategies_updated_at
BEFORE UPDATE ON public.trading_strategies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_symbol ON public.orders(symbol);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_alerts_user_id ON public.alerts(user_id);
CREATE INDEX idx_alerts_triggered ON public.alerts(triggered);
CREATE INDEX idx_trading_strategies_user_id ON public.trading_strategies(user_id);
CREATE INDEX idx_trading_strategies_active ON public.trading_strategies(active);