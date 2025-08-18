-- Create table for user settings including API keys
CREATE TABLE public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  binance_api_key TEXT,
  binance_secret_key TEXT,
  auto_trading_enabled BOOLEAN DEFAULT false,
  auto_tp_sl_enabled BOOLEAN DEFAULT false,
  default_stop_loss_percent NUMERIC DEFAULT 5.0,
  default_take_profit_percent NUMERIC DEFAULT 10.0,
  max_daily_trades INTEGER DEFAULT 50,
  max_position_size NUMERIC DEFAULT 1000.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own settings" 
ON public.user_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own settings" 
ON public.user_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" 
ON public.user_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings" 
ON public.user_settings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add auto_tp_sl columns to orders table for tracking
ALTER TABLE public.orders 
ADD COLUMN stop_loss_price NUMERIC,
ADD COLUMN take_profit_price NUMERIC,
ADD COLUMN auto_tp_sl_enabled BOOLEAN DEFAULT false;