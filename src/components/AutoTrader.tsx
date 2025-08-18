import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Bot, 
  Play, 
  Pause, 
  TrendingUp, 
  TrendingDown,
  Shield,
  Activity,
  AlertCircle
} from 'lucide-react';

const AutoTrader: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [autoTradingEnabled, setAutoTradingEnabled] = useState(false);
  const [autoTPSLEnabled, setAutoTPSLEnabled] = useState(false);
  const [settings, setSettings] = useState({
    default_stop_loss_percent: 5.0,
    default_take_profit_percent: 10.0,
    max_daily_trades: 50,
    max_position_size: 1000.0
  });
  const [tradingStats, setTradingStats] = useState({
    todayTrades: 0,
    activePositions: 0,
    totalProfit: 0
  });

  useEffect(() => {
    loadSettings();
    loadTradingStats();
    
    // Set up interval to check TP/SL conditions
    const tpslInterval = setInterval(() => {
      if (autoTPSLEnabled) {
        checkTPSLConditions();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(tpslInterval);
  }, [autoTPSLEnabled]);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setAutoTradingEnabled(data.auto_trading_enabled || false);
        setAutoTPSLEnabled(data.auto_tp_sl_enabled || false);
        setSettings({
          default_stop_loss_percent: data.default_stop_loss_percent || 5.0,
          default_take_profit_percent: data.default_take_profit_percent || 10.0,
          max_daily_trades: data.max_daily_trades || 50,
          max_position_size: data.max_position_size || 1000.0
        });
      }
    } catch (error: any) {
      console.error('Error loading settings:', error);
    }
  };

  const loadTradingStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get today's trades count
      const today = new Date().toISOString().split('T')[0];
      const { data: todayTrades } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`);

      // Get active positions
      const { data: activePositions } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'filled');

      // Get total profit from trades
      const { data: trades } = await supabase
        .from('trades')
        .select('pnl')
        .eq('user_id', user.id);

      const totalProfit = trades?.reduce((sum, trade) => sum + (trade.pnl || 0), 0) || 0;

      setTradingStats({
        todayTrades: todayTrades?.length || 0,
        activePositions: activePositions?.length || 0,
        totalProfit
      });
    } catch (error: any) {
      console.error('Error loading trading stats:', error);
    }
  };

  const toggleAutoTrading = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const newValue = !autoTradingEnabled;
      
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          auto_trading_enabled: newValue
        }, { onConflict: 'user_id' });

      if (error) throw error;

      setAutoTradingEnabled(newValue);
      
      toast({
        title: newValue ? "Auto Trading Enabled" : "Auto Trading Disabled",
        description: `Auto trading has been ${newValue ? 'enabled' : 'disabled'}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAutoTPSL = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const newValue = !autoTPSLEnabled;
      
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          auto_tp_sl_enabled: newValue
        }, { onConflict: 'user_id' });

      if (error) throw error;

      setAutoTPSLEnabled(newValue);
      
      toast({
        title: newValue ? "Auto TP/SL Enabled" : "Auto TP/SL Disabled",
        description: `Auto take profit/stop loss has been ${newValue ? 'enabled' : 'disabled'}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkTPSLConditions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await supabase.functions.invoke('auto-trader', {
        body: {
          action: 'check_tp_sl',
          userId: user.id
        }
      });

      if (response.error) {
        console.error('TP/SL check error:', response.error);
      } else {
        console.log('TP/SL check results:', response.data);
        // Refresh stats after TP/SL check
        loadTradingStats();
      }
    } catch (error) {
      console.error('Error checking TP/SL conditions:', error);
    }
  };

  const executeTestTrade = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const testTradeSignal = {
        action: 'execute_trade',
        symbol: 'BTCUSDT',
        side: 'BUY',
        quantity: 0.001,
        type: 'MARKET',
        userId: user.id,
        stopLossPercent: settings.default_stop_loss_percent,
        takeProfitPercent: settings.default_take_profit_percent
      };

      const response = await supabase.functions.invoke('auto-trader', {
        body: testTradeSignal
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: "Test Trade Executed",
        description: "Test trade has been executed successfully",
      });

      loadTradingStats();
    } catch (error: any) {
      toast({
        title: "Test Trade Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card className="trading-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bot className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Auto Trading Control</h2>
          </div>
          <Badge 
            variant={autoTradingEnabled ? "default" : "secondary"}
            className={autoTradingEnabled ? "animate-pulse-glow" : ""}
          >
            {autoTradingEnabled ? "ACTIVE" : "INACTIVE"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Auto Trading Toggle */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-center gap-3">
                {autoTradingEnabled ? (
                  <Play className="w-5 h-5 text-profit" />
                ) : (
                  <Pause className="w-5 h-5 text-muted-foreground" />
                )}
                <div>
                  <Label>Auto Trading</Label>
                  <p className="text-sm text-muted-foreground">Enable automated trade execution</p>
                </div>
              </div>
              <Switch
                checked={autoTradingEnabled}
                onCheckedChange={toggleAutoTrading}
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary" />
                <div>
                  <Label>Auto TP/SL</Label>
                  <p className="text-sm text-muted-foreground">Automatic take profit & stop loss</p>
                </div>
              </div>
              <Switch
                checked={autoTPSLEnabled}
                onCheckedChange={toggleAutoTPSL}
                disabled={loading}
              />
            </div>
          </div>

          {/* TP/SL Settings */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stop-loss">Stop Loss (%)</Label>
                <Input
                  id="stop-loss"
                  type="number"
                  step="0.1"
                  value={settings.default_stop_loss_percent}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    default_stop_loss_percent: parseFloat(e.target.value)
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="take-profit">Take Profit (%)</Label>
                <Input
                  id="take-profit"
                  type="number"
                  step="0.1"
                  value={settings.default_take_profit_percent}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    default_take_profit_percent: parseFloat(e.target.value)
                  }))}
                />
              </div>
            </div>

            <Button 
              onClick={executeTestTrade}
              disabled={loading || !autoTradingEnabled}
              variant="outline"
              className="w-full"
            >
              <Activity className="w-4 h-4 mr-2" />
              Execute Test Trade
            </Button>
          </div>
        </div>
      </Card>

      {/* Trading Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="trading-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Today's Trades</p>
              <p className="text-2xl font-bold">{tradingStats.todayTrades}</p>
              <p className="text-xs text-muted-foreground">
                Max: {settings.max_daily_trades}
              </p>
            </div>
            <Activity className="w-8 h-8 text-primary" />
          </div>
        </Card>

        <Card className="trading-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Positions</p>
              <p className="text-2xl font-bold">{tradingStats.activePositions}</p>
            </div>
            <Bot className="w-8 h-8 text-primary" />
          </div>
        </Card>

        <Card className="trading-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Profit</p>
              <p className={`text-2xl font-bold ${tradingStats.totalProfit >= 0 ? 'profit-text' : 'loss-text'}`}>
                {tradingStats.totalProfit >= 0 ? '+' : ''}${tradingStats.totalProfit.toFixed(2)}
              </p>
            </div>
            {tradingStats.totalProfit >= 0 ? (
              <TrendingUp className="w-8 h-8 text-profit" />
            ) : (
              <TrendingDown className="w-8 h-8 text-loss" />
            )}
          </div>
        </Card>
      </div>

      {/* Alerts */}
      {!autoTradingEnabled && (
        <Card className="trading-card p-4 border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <div>
              <p className="font-semibold text-amber-500">Auto Trading Disabled</p>
              <p className="text-sm text-muted-foreground">
                Enable auto trading to allow bots to execute trades automatically
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AutoTrader;