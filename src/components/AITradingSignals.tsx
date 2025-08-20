import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  RefreshCw,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Activity
} from 'lucide-react';

interface TradingSignal {
  id: string;
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  targetPrice: number;
  currentPrice: number;
  stopLoss: number;
  takeProfit: number;
  reasoning: string;
  timeframe: string;
  indicators: {
    rsi: number;
    macd: string;
    volume: string;
    trend: string;
  };
  generated_at: string;
  status: 'active' | 'executed' | 'expired';
}

const AITradingSignals = () => {
  const { toast } = useToast();
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadSignals();
    // Auto-refresh signals every 5 minutes
    const interval = setInterval(loadSignals, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadSignals = async () => {
    try {
      // Generate mock signals for now
      const mockSignals: TradingSignal[] = [
        {
          id: '1',
          symbol: 'BTCUSDT',
          action: 'BUY',
          confidence: 85,
          targetPrice: 44500,
          currentPrice: 43000,
          stopLoss: 41000,
          takeProfit: 46000,
          reasoning: 'Strong bullish momentum with RSI oversold and MACD showing positive divergence. Volume increasing.',
          timeframe: '4H',
          indicators: {
            rsi: 32,
            macd: 'Bullish Crossover',
            volume: 'Increasing',
            trend: 'Bullish'
          },
          generated_at: new Date().toISOString(),
          status: 'active'
        },
        {
          id: '2',
          symbol: 'ETHUSDT',
          action: 'SELL',
          confidence: 72,
          targetPrice: 2500,
          currentPrice: 2600,
          stopLoss: 2700,
          takeProfit: 2400,
          reasoning: 'Overbought conditions with declining volume. Resistance at current levels.',
          timeframe: '1H',
          indicators: {
            rsi: 78,
            macd: 'Bearish Divergence',
            volume: 'Declining',
            trend: 'Bearish'
          },
          generated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          status: 'active'
        },
        {
          id: '3',
          symbol: 'BNBUSDT',
          action: 'HOLD',
          confidence: 58,
          targetPrice: 305,
          currentPrice: 300,
          stopLoss: 290,
          takeProfit: 320,
          reasoning: 'Consolidation phase with mixed signals. Wait for clear breakout direction.',
          timeframe: '1D',
          indicators: {
            rsi: 52,
            macd: 'Neutral',
            volume: 'Average',
            trend: 'Sideways'
          },
          generated_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          status: 'active'
        }
      ];

      setSignals(mockSignals);
    } catch (error: any) {
      console.error('Error loading signals:', error);
      toast({
        title: "Error",
        description: "Failed to load AI trading signals",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateNewSignals = async () => {
    setGenerating(true);
    try {
      // Simulate AI signal generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast({
        title: "AI Analysis Complete",
        description: "New trading signals have been generated",
      });
      
      await loadSignals();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to generate new signals",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const executeSignal = async (signal: TradingSignal) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const tradeSignal = {
        action: 'execute_trade',
        symbol: signal.symbol,
        side: signal.action,
        quantity: 0.01, // Small test quantity
        type: 'MARKET',
        userId: user.id,
        aiGenerated: true,
        signalId: signal.id
      };

      const response = await supabase.functions.invoke('auto-trader', {
        body: tradeSignal
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: "Signal Executed",
        description: `${signal.action} order placed for ${signal.symbol}`,
      });

      // Update signal status
      setSignals(prev => prev.map(s => 
        s.id === signal.id ? { ...s, status: 'executed' as const } : s
      ));
    } catch (error: any) {
      toast({
        title: "Execution Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'BUY': return TrendingUp;
      case 'SELL': return TrendingDown;
      case 'HOLD': return Target;
      default: return Activity;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'BUY': return 'text-profit';
      case 'SELL': return 'text-loss';
      case 'HOLD': return 'text-muted-foreground';
      default: return 'text-primary';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-profit';
    if (confidence >= 60) return 'text-primary';
    return 'text-loss';
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <Card className="trading-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-secondary rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-secondary/50 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="trading-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/20">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">AI Trading Signals</h3>
              <p className="text-muted-foreground">
                AI-powered market analysis and trading recommendations
              </p>
            </div>
          </div>
          <Button 
            variant="premium" 
            onClick={generateNewSignals}
            disabled={generating}
          >
            {generating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Generate Signals
              </>
            )}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-secondary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Signals</p>
                <p className="text-2xl font-bold">{signals.length}</p>
              </div>
              <Activity className="w-8 h-8 text-primary" />
            </div>
          </div>

          <div className="p-4 rounded-lg bg-secondary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Buy Signals</p>
                <p className="text-2xl font-bold text-profit">
                  {signals.filter(s => s.action === 'BUY').length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-profit" />
            </div>
          </div>

          <div className="p-4 rounded-lg bg-secondary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sell Signals</p>
                <p className="text-2xl font-bold text-loss">
                  {signals.filter(s => s.action === 'SELL').length}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-loss" />
            </div>
          </div>

          <div className="p-4 rounded-lg bg-secondary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Confidence</p>
                <p className="text-2xl font-bold">
                  {signals.length > 0 
                    ? (signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length).toFixed(0)
                    : 0}%
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-primary" />
            </div>
          </div>
        </div>
      </Card>

      {/* Signals List */}
      <div className="space-y-4">
        {signals.map((signal) => {
          const ActionIcon = getActionIcon(signal.action);
          const actionColor = getActionColor(signal.action);
          
          return (
            <Card 
              key={signal.id} 
              className={`trading-card p-6 ${
                signal.status === 'executed' ? 'opacity-75' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-3 rounded-lg bg-secondary/50`}>
                    <ActionIcon className={`w-6 h-6 ${actionColor}`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-bold text-lg">{signal.symbol}</h4>
                      <Badge 
                        variant={signal.action === 'BUY' ? 'default' : signal.action === 'SELL' ? 'destructive' : 'secondary'}
                      >
                        {signal.action}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {signal.timeframe}
                      </Badge>
                      {signal.status === 'executed' && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Executed
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">
                      {signal.reasoning}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Current Price</p>
                        <p className="font-semibold">${signal.currentPrice.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Target Price</p>
                        <p className="font-semibold">${signal.targetPrice.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Stop Loss</p>
                        <p className="font-semibold text-loss">${signal.stopLoss.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Take Profit</p>
                        <p className="font-semibold text-profit">${signal.takeProfit.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Technical Indicators */}
                    <div className="mt-4 p-3 rounded-lg bg-secondary/20">
                      <p className="text-xs text-muted-foreground mb-2">Technical Indicators</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-muted-foreground">RSI:</span>
                          <span className={`ml-1 font-medium ${
                            signal.indicators.rsi < 30 ? 'text-profit' : 
                            signal.indicators.rsi > 70 ? 'text-loss' : 'text-primary'
                          }`}>
                            {signal.indicators.rsi}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">MACD:</span>
                          <span className="ml-1 font-medium">{signal.indicators.macd}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Volume:</span>
                          <span className="ml-1 font-medium">{signal.indicators.volume}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Trend:</span>
                          <span className={`ml-1 font-medium ${
                            signal.indicators.trend === 'Bullish' ? 'text-profit' : 
                            signal.indicators.trend === 'Bearish' ? 'text-loss' : 'text-muted-foreground'
                          }`}>
                            {signal.indicators.trend}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  {/* Confidence Score */}
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                    <div className={`text-2xl font-bold ${getConfidenceColor(signal.confidence)}`}>
                      {signal.confidence}%
                    </div>
                    <Progress value={signal.confidence} className="w-16 h-2 mt-1" />
                  </div>

                  {/* Time */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimeAgo(signal.generated_at)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {signal.status === 'active' && (
                      <Button
                        size="sm"
                        variant="premium"
                        onClick={() => executeSignal(signal)}
                        className="text-xs"
                      >
                        Execute
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}

        {signals.length === 0 && (
          <Card className="trading-card p-12 text-center">
            <Brain className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-bold mb-2">No AI Signals Available</h3>
            <p className="text-muted-foreground mb-6">
              Generate new AI-powered trading signals to get started
            </p>
            <Button variant="premium" onClick={generateNewSignals}>
              <Zap className="w-4 h-4 mr-2" />
              Generate First Signals
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AITradingSignals;