import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import BotConfiguration from './BotConfiguration';
import MarketData from './MarketData';
import PortfolioManager from './PortfolioManager';
import TradingHistory from './TradingHistory';
import OrderManagement from './OrderManagement';
import AlertsManager from './AlertsManager';
import AutomatedStrategies from './AutomatedStrategies';
import Settings from './Settings';
import AutoTrader from './AutoTrader';
import BotManagement from './BotManagement';
import AITradingSignals from './AITradingSignals';
import BotAnalytics from './BotAnalytics';
import GridTradingSpot from './GridTradingSpot';
import GridTradingFutures from './GridTradingFutures';
import { 
  TrendingUp, 
  TrendingDown, 
  Bot, 
  Settings as SettingsIcon, 
  Activity,
  DollarSign,
  BarChart3,
  Shield,
  AlertTriangle,
  LogOut
} from 'lucide-react';

const TradingDashboard = () => {
  const { toast } = useToast();
  const [showBotConfig, setShowBotConfig] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Signed out",
        description: "You have been successfully signed out",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const [dashboardData, setDashboardData] = useState({
    totalBalance: 0,
    totalPnL: 0,
    pnlPercent: 0,
    activeBots: 0,
    totalTrades: 0,
    winRate: 0,
    positions: [],
    bots: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get portfolio data
      const { data: portfolioData } = await supabase.functions.invoke('portfolio-sync');
      
      // Get trading stats
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id);

      const { data: trades } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id);

      const { data: bots } = await supabase
        .from('trading_bots')
        .select('*')
        .eq('user_id', user.id);

      const activeBots = bots?.filter(bot => bot.status === 'active').length || 0;
      const totalTrades = trades?.length || 0;
      const winningTrades = trades?.filter(trade => (trade.pnl || 0) > 0).length || 0;
      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

      // Get active positions
      const activePositions = orders?.filter(order => order.status === 'filled').slice(0, 3).map(order => ({
        symbol: order.symbol,
        side: order.side,
        size: order.quantity,
        pnl: Math.random() * 2000 - 500, // This would come from current price calculation
        pnlPercent: Math.random() * 10 - 2
      })) || [];

      setDashboardData({
        totalBalance: portfolioData?.totalValue || 0,
        totalPnL: portfolioData?.totalPnL || 0,
        pnlPercent: portfolioData?.totalPnLPercent || 0,
        activeBots,
        totalTrades,
        winRate,
        positions: activePositions,
        bots: bots?.slice(0, 3).map(bot => ({
          name: bot.name,
          status: bot.status,
          profit: bot.total_profit || 0,
          trades: bot.total_trades || 0
        })) || []
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Binance Guardian Pro
            </h1>
            <p className="text-muted-foreground mt-2">Enterprise Trading Bot Platform</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
              <SettingsIcon className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button variant="premium" size="sm" onClick={() => setShowBotConfig(true)}>
              <Bot className="w-4 h-4 mr-2" />
              New Bot
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-13 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="market">Market</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="bots">Bot Manager</TabsTrigger>
          <TabsTrigger value="autotrader">Auto Trader</TabsTrigger>
          <TabsTrigger value="grid-spot">Grid Spot</TabsTrigger>
          <TabsTrigger value="grid-futures">Grid Futures</TabsTrigger>
          <TabsTrigger value="ai-signals">AI Signals</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="trading-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Balance</p>
                  <p className="text-2xl font-bold">${dashboardData.totalBalance.toLocaleString()}</p>
                </div>
                <DollarSign className="w-8 h-8 text-primary" />
              </div>
            </Card>

            <Card className="trading-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total P&L</p>
                  <p className={`text-2xl font-bold ${dashboardData.totalPnL > 0 ? 'profit-text' : 'loss-text'}`}>
                    {dashboardData.totalPnL > 0 ? '+' : ''}${dashboardData.totalPnL.toLocaleString()}
                  </p>
                  <p className={`text-sm ${dashboardData.pnlPercent > 0 ? 'profit-text' : 'loss-text'}`}>
                    {dashboardData.pnlPercent > 0 ? '+' : ''}{dashboardData.pnlPercent.toFixed(2)}%
                  </p>
                </div>
                {dashboardData.totalPnL > 0 ? (
                  <TrendingUp className="w-8 h-8 text-profit" />
                ) : (
                  <TrendingDown className="w-8 h-8 text-loss" />
                )}
              </div>
            </Card>

            <Card className="trading-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Bots</p>
                  <p className="text-2xl font-bold">{dashboardData.activeBots}</p>
                </div>
                <Bot className="w-8 h-8 text-primary" />
              </div>
            </Card>

            <Card className="trading-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  <p className="text-2xl font-bold">{dashboardData.winRate.toFixed(1)}%</p>
                  <Progress value={dashboardData.winRate} className="mt-2" />
                </div>
                <BarChart3 className="w-8 h-8 text-primary" />
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Positions */}
            <Card className="trading-card p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-primary" />
                  Active Positions
                </h3>
                <Badge variant="secondary">{dashboardData.positions.length} positions</Badge>
              </div>
              
              <div className="space-y-4">
                {dashboardData.positions.map((position, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="font-semibold">{position.symbol}</p>
                        <Badge variant={position.side === 'LONG' ? 'default' : 'destructive'} className="text-xs">
                          {position.side}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Size</p>
                        <p className="font-mono">{position.size}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`font-bold ${position.pnl > 0 ? 'profit-text' : 'loss-text'}`}>
                        {position.pnl > 0 ? '+' : ''}${position.pnl.toFixed(2)}
                      </p>
                      <p className={`text-sm ${position.pnlPercent > 0 ? 'profit-text' : 'loss-text'}`}>
                        {position.pnlPercent > 0 ? '+' : ''}{position.pnlPercent}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Trading Bots */}
            <Card className="trading-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold flex items-center">
                  <Bot className="w-5 h-5 mr-2 text-primary" />
                  Trading Bots
                </h3>
              </div>
              
              <div className="space-y-4">
                {dashboardData.bots.map((bot, index) => (
                  <div key={index} className="p-4 rounded-lg bg-secondary/50 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold">{bot.name}</p>
                      <Badge 
                        variant={bot.status === 'active' ? 'default' : 'secondary'}
                        className={bot.status === 'active' ? 'animate-pulse-glow' : ''}
                      >
                        {bot.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      <p>Trades: {bot.trades}</p>
                    </div>
                    <p className="profit-text font-semibold">
                      +${bot.profit.toFixed(2)}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" className="flex-1">
                        Configure
                      </Button>
                      <Button 
                        variant={bot.status === 'active' ? 'destructive' : 'default'} 
                        size="sm"
                        className="flex-1"
                      >
                        {bot.status === 'active' ? 'Stop' : 'Start'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Risk Management Panel */}
          <Card className="trading-card p-6 mt-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold flex items-center">
                <Shield className="w-5 h-5 mr-2 text-primary" />
                Risk Management
              </h3>
              <Button variant="outline" size="sm">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Emergency Stop All
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Daily Loss Limit</p>
                <div className="flex items-center gap-2">
                  <Progress value={25} className="flex-1" />
                  <span className="text-sm">25%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">$2,500 / $10,000</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">Position Size Risk</p>
                <div className="flex items-center gap-2">
                  <Progress value={60} className="flex-1" />
                  <span className="text-sm">60%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Moderate Risk</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">Portfolio Exposure</p>
                <div className="flex items-center gap-2">
                  <Progress value={85} className="flex-1" />
                  <span className="text-sm">85%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">High Exposure</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="portfolio">
          <PortfolioManager />
        </TabsContent>

        <TabsContent value="market">
          <MarketData />
        </TabsContent>

        <TabsContent value="orders">
          <OrderManagement />
        </TabsContent>

        <TabsContent value="strategies">
          <AutomatedStrategies />
        </TabsContent>

        <TabsContent value="alerts">
          <AlertsManager />
        </TabsContent>

        <TabsContent value="history">
          <TradingHistory />
        </TabsContent>

        <TabsContent value="bots">
          <BotManagement />
        </TabsContent>

        <TabsContent value="autotrader">
          <AutoTrader />
        </TabsContent>

        <TabsContent value="grid-spot">
          <GridTradingSpot />
        </TabsContent>

        <TabsContent value="grid-futures">
          <GridTradingFutures />
        </TabsContent>

        <TabsContent value="ai-signals">
          <AITradingSignals />
        </TabsContent>

        <TabsContent value="analytics">
          <BotAnalytics />
        </TabsContent>
      </Tabs>

      {showBotConfig && (
        <BotConfiguration onClose={() => setShowBotConfig(false)} />
      )}

      {showSettings && (
        <Settings onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};

export default TradingDashboard;