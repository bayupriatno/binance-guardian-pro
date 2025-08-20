import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Activity,
  Target,
  Clock,
  Calendar,
  Zap,
  Bot,
  RefreshCw
} from 'lucide-react';

interface BotPerformance {
  id: string;
  name: string;
  strategy: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfit: number;
  avgProfit: number;
  maxDrawdown: number;
  profitFactor: number;
  avgTradeTime: number;
  dailyReturns: number[];
  monthlyPerformance: {
    month: string;
    profit: number;
    trades: number;
  }[];
  recentTrades: {
    date: string;
    symbol: string;
    side: string;
    profit: number;
  }[];
}

const BotAnalytics = () => {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<BotPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBot, setSelectedBot] = useState<string>('all');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get bots data
      const { data: bots } = await supabase
        .from('trading_bots')
        .select('*')
        .eq('user_id', user.id);

      // Get trades data
      const { data: trades } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id);

      // Generate mock analytics data for demonstration
      const mockAnalytics: BotPerformance[] = (bots || []).map(bot => ({
        id: bot.id,
        name: bot.name,
        strategy: bot.strategy,
        totalTrades: bot.total_trades || Math.floor(Math.random() * 100) + 10,
        winningTrades: Math.floor((bot.total_trades || 50) * 0.6),
        losingTrades: Math.floor((bot.total_trades || 50) * 0.4),
        winRate: bot.win_rate || (Math.random() * 40 + 50),
        totalProfit: bot.total_profit || (Math.random() * 5000 - 1000),
        avgProfit: (Math.random() * 100 - 20),
        maxDrawdown: -(Math.random() * 15 + 5),
        profitFactor: Math.random() * 1.5 + 0.8,
        avgTradeTime: Math.random() * 24 + 1,
        dailyReturns: Array.from({length: 30}, () => Math.random() * 10 - 3),
        monthlyPerformance: [
          { month: 'Jan', profit: Math.random() * 1000 - 200, trades: Math.floor(Math.random() * 50) + 10 },
          { month: 'Feb', profit: Math.random() * 1000 - 200, trades: Math.floor(Math.random() * 50) + 10 },
          { month: 'Mar', profit: Math.random() * 1000 - 200, trades: Math.floor(Math.random() * 50) + 10 },
        ],
        recentTrades: [
          { date: '2024-01-20', symbol: 'BTCUSDT', side: 'BUY', profit: Math.random() * 200 - 50 },
          { date: '2024-01-19', symbol: 'ETHUSDT', side: 'SELL', profit: Math.random() * 200 - 50 },
          { date: '2024-01-18', symbol: 'BNBUSDT', side: 'BUY', profit: Math.random() * 200 - 50 },
        ]
      }));

      setAnalytics(mockAnalytics);
    } catch (error: any) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load bot analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getOverallStats = () => {
    const filteredBots = selectedBot === 'all' 
      ? analytics 
      : analytics.filter(bot => bot.id === selectedBot);

    return {
      totalTrades: filteredBots.reduce((sum, bot) => sum + bot.totalTrades, 0),
      totalProfit: filteredBots.reduce((sum, bot) => sum + bot.totalProfit, 0),
      avgWinRate: filteredBots.length > 0 
        ? filteredBots.reduce((sum, bot) => sum + bot.winRate, 0) / filteredBots.length 
        : 0,
      activeBots: filteredBots.length,
      bestPerformer: filteredBots.reduce((best, bot) => 
        bot.totalProfit > (best?.totalProfit || -Infinity) ? bot : best, null as BotPerformance | null)
    };
  };

  const formatDuration = (hours: number) => {
    if (hours < 1) return `${Math.floor(hours * 60)}m`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const stats = getOverallStats();

  if (loading) {
    return (
      <Card className="trading-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-secondary rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-secondary/50 rounded"></div>
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
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Bot Analytics</h3>
              <p className="text-muted-foreground">
                Comprehensive performance analysis of your trading bots
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={selectedBot}
              onChange={(e) => setSelectedBot(e.target.value)}
              className="px-3 py-2 bg-secondary border border-border rounded-lg text-sm"
            >
              <option value="all">All Bots</option>
              {analytics.map(bot => (
                <option key={bot.id} value={bot.id}>{bot.name}</option>
              ))}
            </select>
            <Button variant="outline" onClick={loadAnalytics}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-secondary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Trades</p>
                <p className="text-2xl font-bold">{stats.totalTrades}</p>
              </div>
              <Activity className="w-8 h-8 text-primary" />
            </div>
          </div>

          <div className="p-4 rounded-lg bg-secondary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Profit</p>
                <p className={`text-2xl font-bold ${
                  stats.totalProfit >= 0 ? 'profit-text' : 'loss-text'
                }`}>
                  {stats.totalProfit >= 0 ? '+' : ''}${stats.totalProfit.toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-primary" />
            </div>
          </div>

          <div className="p-4 rounded-lg bg-secondary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Win Rate</p>
                <p className="text-2xl font-bold">{stats.avgWinRate.toFixed(1)}%</p>
              </div>
              <Target className="w-8 h-8 text-primary" />
            </div>
          </div>

          <div className="p-4 rounded-lg bg-secondary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Bots</p>
                <p className="text-2xl font-bold">{stats.activeBots}</p>
              </div>
              <Bot className="w-8 h-8 text-primary" />
            </div>
          </div>
        </div>
      </Card>

      {/* Detailed Analytics */}
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trades">Trade History</TabsTrigger>
          <TabsTrigger value="comparison">Bot Comparison</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          {/* Best Performer */}
          {stats.bestPerformer && (
            <Card className="trading-card p-6">
              <h4 className="font-semibold mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-primary" />
                Best Performing Bot
              </h4>
              <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div>
                  <h5 className="font-bold text-lg">{stats.bestPerformer.name}</h5>
                  <p className="text-sm text-muted-foreground">
                    {stats.bestPerformer.strategy.toUpperCase()} Strategy
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold profit-text">
                    +${stats.bestPerformer.totalProfit.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {stats.bestPerformer.winRate.toFixed(1)}% win rate
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Individual Bot Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {(selectedBot === 'all' ? analytics : analytics.filter(bot => bot.id === selectedBot)).map((bot) => (
              <Card key={bot.id} className="trading-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h5 className="font-bold">{bot.name}</h5>
                    <Badge variant="outline" className="text-xs">
                      {bot.strategy.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      bot.totalProfit >= 0 ? 'profit-text' : 'loss-text'
                    }`}>
                      {bot.totalProfit >= 0 ? '+' : ''}${bot.totalProfit.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Win Rate</span>
                    <span className="font-medium">{bot.winRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={bot.winRate} className="h-2" />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Trades</p>
                      <p className="font-semibold">{bot.totalTrades}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg Trade Time</p>
                      <p className="font-semibold">{formatDuration(bot.avgTradeTime)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Profit Factor</p>
                      <p className="font-semibold">{bot.profitFactor.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Max Drawdown</p>
                      <p className="font-semibold loss-text">{bot.maxDrawdown.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trades" className="space-y-6">
          <Card className="trading-card p-6">
            <h4 className="font-semibold mb-4">Recent Trades</h4>
            <div className="space-y-3">
              {analytics.flatMap(bot => 
                bot.recentTrades.map((trade, index) => (
                  <div key={`${bot.id}-${index}`} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20">
                    <div className="flex items-center gap-3">
                      <Badge variant={trade.side === 'BUY' ? 'default' : 'destructive'} className="text-xs">
                        {trade.side}
                      </Badge>
                      <span className="font-medium">{trade.symbol}</span>
                      <span className="text-sm text-muted-foreground">{bot.name}</span>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        trade.profit >= 0 ? 'profit-text' : 'loss-text'
                      }`}>
                        {trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">{trade.date}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <Card className="trading-card p-6">
            <h4 className="font-semibold mb-4">Bot Comparison</h4>
            <div className="space-y-4">
              {analytics.map((bot) => (
                <div key={bot.id} className="p-4 rounded-lg bg-secondary/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{bot.name}</span>
                    <span className={`font-bold ${
                      bot.totalProfit >= 0 ? 'profit-text' : 'loss-text'
                    }`}>
                      {bot.totalProfit >= 0 ? '+' : ''}${bot.totalProfit.toFixed(2)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Win Rate: </span>
                      <span className="font-medium">{bot.winRate.toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Trades: </span>
                      <span className="font-medium">{bot.totalTrades}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Strategy: </span>
                      <span className="font-medium">{bot.strategy.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          <Card className="trading-card p-6">
            <h4 className="font-semibold mb-4">Risk Metrics</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {analytics.map((bot) => (
                <div key={bot.id} className="p-4 rounded-lg bg-secondary/20">
                  <h5 className="font-semibold mb-3">{bot.name}</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max Drawdown</span>
                      <span className="font-medium loss-text">{bot.maxDrawdown.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Profit Factor</span>
                      <span className={`font-medium ${
                        bot.profitFactor > 1 ? 'profit-text' : 'loss-text'
                      }`}>
                        {bot.profitFactor.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Win/Loss Ratio</span>
                      <span className="font-medium">
                        {bot.losingTrades > 0 ? (bot.winningTrades / bot.losingTrades).toFixed(2) : '∞'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg Profit</span>
                      <span className={`font-medium ${
                        bot.avgProfit >= 0 ? 'profit-text' : 'loss-text'
                      }`}>
                        {bot.avgProfit >= 0 ? '+' : ''}${bot.avgProfit.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BotAnalytics;