import React, { useState } from 'react';
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
import { 
  TrendingUp, 
  TrendingDown, 
  Bot, 
  Settings, 
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

  const mockData = {
    totalBalance: 125849.67,
    totalPnL: 8432.15,
    pnlPercent: 7.2,
    activeBots: 5,
    totalTrades: 247,
    winRate: 68.4,
    positions: [
      { symbol: 'BTCUSDT', side: 'LONG', size: 0.5, pnl: 1250.45, pnlPercent: 4.2 },
      { symbol: 'ETHUSDT', side: 'SHORT', size: 2.1, pnl: -340.20, pnlPercent: -1.8 },
      { symbol: 'ADAUSDT', side: 'LONG', size: 1000, pnl: 89.67, pnlPercent: 2.1 },
    ],
    bots: [
      { name: 'DCA Pro', status: 'active', profit: 2450.67, trades: 45 },
      { name: 'Grid Master', status: 'active', profit: 1890.23, trades: 78 },
      { name: 'Momentum', status: 'paused', profit: 567.89, trades: 12 },
    ]
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
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
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
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="market">Market</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="bots">Bots</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="trading-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Balance</p>
                  <p className="text-2xl font-bold">${mockData.totalBalance.toLocaleString()}</p>
                </div>
                <DollarSign className="w-8 h-8 text-primary" />
              </div>
            </Card>

            <Card className="trading-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total P&L</p>
                  <p className={`text-2xl font-bold ${mockData.totalPnL > 0 ? 'profit-text' : 'loss-text'}`}>
                    {mockData.totalPnL > 0 ? '+' : ''}${mockData.totalPnL.toLocaleString()}
                  </p>
                  <p className={`text-sm ${mockData.pnlPercent > 0 ? 'profit-text' : 'loss-text'}`}>
                    {mockData.pnlPercent > 0 ? '+' : ''}{mockData.pnlPercent}%
                  </p>
                </div>
                {mockData.totalPnL > 0 ? (
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
                  <p className="text-2xl font-bold">{mockData.activeBots}</p>
                </div>
                <Bot className="w-8 h-8 text-primary" />
              </div>
            </Card>

            <Card className="trading-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  <p className="text-2xl font-bold">{mockData.winRate}%</p>
                  <Progress value={mockData.winRate} className="mt-2" />
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
                <Badge variant="secondary">{mockData.positions.length} positions</Badge>
              </div>
              
              <div className="space-y-4">
                {mockData.positions.map((position, index) => (
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
                {mockData.bots.map((bot, index) => (
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

        <TabsContent value="history">
          <TradingHistory />
        </TabsContent>

        <TabsContent value="bots">
          <div className="text-center p-8">
            <Bot className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Bot Management</h3>
            <p className="text-muted-foreground mb-4">Create and manage your trading bots</p>
            <Button variant="premium" onClick={() => setShowBotConfig(true)}>
              <Bot className="w-4 h-4 mr-2" />
              Create New Bot
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {showBotConfig && (
        <BotConfiguration onClose={() => setShowBotConfig(false)} />
      )}
    </div>
  );
};

export default TradingDashboard;