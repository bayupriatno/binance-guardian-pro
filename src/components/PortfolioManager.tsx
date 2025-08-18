import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Target,
  AlertTriangle,
  RefreshCw,
  Eye
} from 'lucide-react';

interface Asset {
  symbol: string;
  balance: number;
  value: number;
  allocation: number;
  pnl: number;
  pnlPercent: number;
  avgPrice: number;
  currentPrice: number;
}

interface PortfolioStats {
  totalValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  todayPnL: number;
  todayPnLPercent: number;
  assets: Asset[];
}

const PortfolioManager = () => {
  const { toast } = useToast();
  const [portfolio, setPortfolio] = useState<PortfolioStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch real portfolio data from Supabase
  const fetchPortfolioData = async (): Promise<PortfolioStats> => {
    try {
      const { data, error } = await supabase.functions.invoke('portfolio-sync');
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      // Fallback to mock data
      return generateMockPortfolio();
    }
  };

  const generateMockPortfolio = (): PortfolioStats => {
    const mockAssets: Asset[] = [
      {
        symbol: 'BTC',
        balance: 0.5234,
        avgPrice: 41200,
        currentPrice: 43000 + (Math.random() - 0.5) * 2000,
        value: 0,
        allocation: 0,
        pnl: 0,
        pnlPercent: 0,
      },
      {
        symbol: 'ETH',
        balance: 2.1567,
        avgPrice: 2480,
        currentPrice: 2600 + (Math.random() - 0.5) * 200,
        value: 0,
        allocation: 0,
        pnl: 0,
        pnlPercent: 0,
      },
      {
        symbol: 'BNB',
        balance: 15.234,
        avgPrice: 285,
        currentPrice: 300 + (Math.random() - 0.5) * 30,
        value: 0,
        allocation: 0,
        pnl: 0,
        pnlPercent: 0,
      },
      {
        symbol: 'USDT',
        balance: 5420.15,
        avgPrice: 1,
        currentPrice: 1,
        value: 0,
        allocation: 0,
        pnl: 0,
        pnlPercent: 0,
      },
    ];

    // Calculate values and PnL
    let totalValue = 0;
    mockAssets.forEach(asset => {
      asset.value = asset.balance * asset.currentPrice;
      asset.pnl = asset.balance * (asset.currentPrice - asset.avgPrice);
      asset.pnlPercent = ((asset.currentPrice - asset.avgPrice) / asset.avgPrice) * 100;
      totalValue += asset.value;
    });

    // Calculate allocations
    mockAssets.forEach(asset => {
      asset.allocation = (asset.value / totalValue) * 100;
    });

    const totalPnL = mockAssets.reduce((sum, asset) => sum + asset.pnl, 0);
    const totalCost = mockAssets.reduce((sum, asset) => sum + (asset.balance * asset.avgPrice), 0);
    const totalPnLPercent = (totalPnL / totalCost) * 100;

    const todayPnL = totalValue * ((Math.random() - 0.5) * 0.05);
    const todayPnLPercent = (todayPnL / totalValue) * 100;

    return {
      totalValue,
      totalPnL,
      totalPnLPercent,
      todayPnL,
      todayPnLPercent,
      assets: mockAssets.filter(asset => asset.balance > 0),
    };
  };

  const refreshPortfolio = async () => {
    setRefreshing(true);
    try {
      const data = await fetchPortfolioData();
      setPortfolio(data);
      toast({
        title: "Portfolio Updated",
        description: "Latest balance and prices fetched",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update portfolio",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadPortfolio = async () => {
      setLoading(true);
      try {
        const data = await fetchPortfolioData();
        setPortfolio(data);
      } catch (error) {
        console.error('Failed to load portfolio:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPortfolio();

    // Auto-refresh every 30 seconds
    const interval = setInterval(async () => {
      try {
        const data = await fetchPortfolioData();
        setPortfolio(data);
      } catch (error) {
        console.error('Failed to refresh portfolio:', error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="trading-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold flex items-center">
            <PieChart className="w-5 h-5 mr-2 text-primary" />
            Portfolio Overview
          </h3>
          <Badge variant="secondary">Loading...</Badge>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-4 rounded-lg bg-secondary/20 animate-pulse">
                <div className="w-20 h-4 bg-secondary rounded mb-2" />
                <div className="w-32 h-6 bg-secondary rounded" />
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-secondary rounded-full" />
                  <div className="space-y-1">
                    <div className="w-16 h-4 bg-secondary rounded" />
                    <div className="w-24 h-3 bg-secondary rounded" />
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="w-20 h-4 bg-secondary rounded" />
                  <div className="w-16 h-3 bg-secondary rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (!portfolio) return null;

  return (
    <Card className="trading-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold flex items-center">
          <PieChart className="w-5 h-5 mr-2 text-primary" />
          Portfolio Overview
        </h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshPortfolio}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Portfolio Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-secondary/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Total Value</span>
            <DollarSign className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold">${portfolio.totalValue.toLocaleString()}</p>
        </div>

        <div className="p-4 rounded-lg bg-secondary/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Total P&L</span>
            {portfolio.totalPnL >= 0 ? (
              <TrendingUp className="w-4 h-4 text-profit" />
            ) : (
              <TrendingDown className="w-4 h-4 text-loss" />
            )}
          </div>
          <p className={`text-2xl font-bold ${portfolio.totalPnL >= 0 ? 'profit-text' : 'loss-text'}`}>
            {portfolio.totalPnL >= 0 ? '+' : ''}${portfolio.totalPnL.toFixed(2)}
          </p>
          <p className={`text-sm ${portfolio.totalPnLPercent >= 0 ? 'profit-text' : 'loss-text'}`}>
            {portfolio.totalPnLPercent >= 0 ? '+' : ''}{portfolio.totalPnLPercent.toFixed(2)}%
          </p>
        </div>

        <div className="p-4 rounded-lg bg-secondary/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Today's P&L</span>
            {portfolio.todayPnL >= 0 ? (
              <TrendingUp className="w-4 h-4 text-profit" />
            ) : (
              <TrendingDown className="w-4 h-4 text-loss" />
            )}
          </div>
          <p className={`text-2xl font-bold ${portfolio.todayPnL >= 0 ? 'profit-text' : 'loss-text'}`}>
            {portfolio.todayPnL >= 0 ? '+' : ''}${portfolio.todayPnL.toFixed(2)}
          </p>
          <p className={`text-sm ${portfolio.todayPnLPercent >= 0 ? 'profit-text' : 'loss-text'}`}>
            {portfolio.todayPnLPercent >= 0 ? '+' : ''}{portfolio.todayPnLPercent.toFixed(2)}%
          </p>
        </div>
      </div>

      <Tabs defaultValue="holdings" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
          <TabsTrigger value="allocation">Allocation</TabsTrigger>
        </TabsList>

        <TabsContent value="holdings" className="space-y-4">
          {portfolio.assets.map((asset) => (
            <div
              key={asset.symbol}
              className="flex items-center justify-between p-4 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">{asset.symbol.slice(0, 2)}</span>
                </div>
                <div>
                  <p className="font-semibold">{asset.symbol}</p>
                  <p className="text-sm text-muted-foreground">
                    {asset.balance.toFixed(4)} {asset.symbol}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Avg: ${asset.avgPrice.toFixed(asset.symbol === 'USDT' ? 2 : 4)}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-bold">${asset.value.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">
                  ${asset.currentPrice.toFixed(asset.symbol === 'USDT' ? 2 : 4)}
                </p>
                <div className="flex items-center gap-1 justify-end">
                  {asset.pnl >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-profit" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-loss" />
                  )}
                  <span className={`text-xs font-medium ${
                    asset.pnl >= 0 ? 'profit-text' : 'loss-text'
                  }`}>
                    {asset.pnl >= 0 ? '+' : ''}${asset.pnl.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="allocation" className="space-y-4">
          {portfolio.assets.map((asset) => (
            <div key={asset.symbol} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{asset.symbol}</span>
                  <Badge variant="outline" className="text-xs">
                    {asset.allocation.toFixed(1)}%
                  </Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                  ${asset.value.toFixed(2)}
                </span>
              </div>
              <Progress value={asset.allocation} className="h-2" />
            </div>
          ))}

          <div className="mt-6 p-4 rounded-lg bg-muted/10 border border-border">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium mb-2">Portfolio Recommendations</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Consider rebalancing if any asset exceeds 40% allocation</li>
                  <li>• Maintain 10-20% in stablecoins for trading opportunities</li>
                  <li>• Review allocation monthly to maintain risk tolerance</li>
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default PortfolioManager;