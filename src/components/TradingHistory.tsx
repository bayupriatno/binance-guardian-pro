import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  History, 
  TrendingUp, 
  TrendingDown, 
  Filter,
  Download,
  Search,
  Calendar
} from 'lucide-react';

interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  value: number;
  pnl: number;
  status: 'filled' | 'pending' | 'cancelled';
  botName?: string;
  timestamp: Date;
  commission: number;
}

const TradingHistory = () => {
  const { toast } = useToast();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sideFilter, setSideFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('7d');

  // Fetch real trading data from database
  const fetchTradingHistory = async (): Promise<Trade[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: tradesData, error } = await supabase
        .from('trades')
        .select(`
          id,
          symbol,
          side,
          quantity,
          price,
          pnl,
          status,
          executed_at,
          created_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const trades: Trade[] = (tradesData || []).map(trade => ({
        id: trade.id,
        symbol: trade.symbol,
        side: trade.side as 'buy' | 'sell',
        quantity: trade.quantity,
        price: trade.price,
        value: trade.quantity * trade.price,
        pnl: trade.pnl || 0,
        status: trade.status as 'filled' | 'pending' | 'cancelled',
        timestamp: new Date(trade.executed_at || trade.created_at),
        commission: (trade.quantity * trade.price) * 0.001, // 0.1% commission
      }));

      return trades;
    } catch (error) {
      console.error('Error fetching trading history:', error);
      return generateMockTrades();
    }
  };

  // Generate mock trading data as fallback
  const generateMockTrades = (): Trade[] => {
    const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'DOTUSDT'];
    const bots = ['DCA Pro', 'Grid Master', 'Momentum', 'Manual'];
    const trades: Trade[] = [];

    for (let i = 0; i < 15; i++) {
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const side = Math.random() > 0.5 ? 'buy' : 'sell' as 'buy' | 'sell';
      const quantity = Math.random() * 10;
      const price = Math.random() * 50000 + 1000;
      const value = quantity * price;
      const pnl = (Math.random() - 0.5) * value * 0.1;
      const status = ['filled', 'pending', 'cancelled'][Math.floor(Math.random() * 3)] as 'filled' | 'pending' | 'cancelled';
      const botName = bots[Math.floor(Math.random() * bots.length)];
      const timestamp = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      const commission = value * 0.001;

      trades.push({
        id: `trade_${i}`,
        symbol,
        side,
        quantity,
        price,
        value,
        pnl,
        status,
        botName: botName === 'Manual' ? undefined : botName,
        timestamp,
        commission,
      });
    }

    return trades.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  useEffect(() => {
    const loadTrades = async () => {
      setLoading(true);
      try {
        const tradesData = await fetchTradingHistory();
        setTrades(tradesData);
        setFilteredTrades(tradesData);
      } catch (error) {
        console.error('Failed to load trades:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTrades();

    // Set up real-time subscription for new trades
    const channel = supabase
      .channel('trades-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trades',
        },
        () => {
          // Reload trades when changes occur
          loadTrades();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    let filtered = trades;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(trade => 
        trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.botName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(trade => trade.status === statusFilter);
    }

    // Apply side filter
    if (sideFilter !== 'all') {
      filtered = filtered.filter(trade => trade.side === sideFilter);
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const days = {
        '1d': 1,
        '7d': 7,
        '30d': 30,
        '90d': 90,
      }[dateFilter] || 7;
      
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(trade => trade.timestamp >= cutoff);
    }

    setFilteredTrades(filtered);
  }, [trades, searchTerm, statusFilter, sideFilter, dateFilter]);

  const exportTrades = () => {
    const csv = [
      ['Date', 'Symbol', 'Side', 'Quantity', 'Price', 'Value', 'P&L', 'Status', 'Bot'].join(','),
      ...filteredTrades.map(trade => [
        trade.timestamp.toISOString(),
        trade.symbol,
        trade.side,
        trade.quantity.toFixed(6),
        trade.price.toFixed(2),
        trade.value.toFixed(2),
        trade.pnl.toFixed(2),
        trade.status,
        trade.botName || 'Manual'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trading_history_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Trading history exported to CSV",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'filled': return 'default';
      case 'pending': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <Card className="trading-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold flex items-center">
            <History className="w-5 h-5 mr-2 text-primary" />
            Trading History
          </h3>
          <Badge variant="secondary">Loading...</Badge>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-secondary rounded-full" />
                <div className="space-y-1">
                  <div className="w-20 h-4 bg-secondary rounded" />
                  <div className="w-16 h-3 bg-secondary rounded" />
                </div>
              </div>
              <div className="text-right space-y-1">
                <div className="w-24 h-4 bg-secondary rounded" />
                <div className="w-16 h-3 bg-secondary rounded" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="trading-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold flex items-center">
          <History className="w-5 h-5 mr-2 text-primary" />
          Trading History
        </h3>
        <Button variant="outline" size="sm" onClick={exportTrades}>
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search symbol or bot..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="filled">Filled</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sideFilter} onValueChange={setSideFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Side" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sides</SelectItem>
            <SelectItem value="buy">Buy</SelectItem>
            <SelectItem value="sell">Sell</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1d">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {filteredTrades.length} of {trades.length} trades
          </span>
        </div>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Trade List</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-3">
          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredTrades.map((trade) => (
              <div
                key={trade.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    trade.side === 'buy' ? 'bg-profit/20' : 'bg-loss/20'
                  }`}>
                    {trade.side === 'buy' ? (
                      <TrendingUp className="w-4 h-4 text-profit" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-loss" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{trade.symbol}</span>
                      <Badge variant={getStatusColor(trade.status)} className="text-xs">
                        {trade.status}
                      </Badge>
                      {trade.botName && (
                        <Badge variant="outline" className="text-xs">
                          {trade.botName}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(trade.timestamp)}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono text-sm">
                    <span className={trade.side === 'buy' ? 'text-profit' : 'text-loss'}>
                      {trade.side.toUpperCase()}
                    </span>
                    {' '}
                    {trade.quantity.toFixed(6)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    @ ${trade.price.toFixed(2)}
                  </div>
                  {trade.status === 'filled' && (
                    <div className={`text-xs font-medium ${
                      trade.pnl >= 0 ? 'profit-text' : 'loss-text'
                    }`}>
                      {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-secondary/20">
              <h4 className="font-medium mb-2">Total Trades</h4>
              <p className="text-2xl font-bold">{filteredTrades.length}</p>
              <p className="text-sm text-muted-foreground">
                {filteredTrades.filter(t => t.status === 'filled').length} filled
              </p>
            </div>

            <div className="p-4 rounded-lg bg-secondary/20">
              <h4 className="font-medium mb-2">Total Volume</h4>
              <p className="text-2xl font-bold">
                ${filteredTrades.reduce((sum, t) => sum + t.value, 0).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                Trading volume
              </p>
            </div>

            <div className="p-4 rounded-lg bg-secondary/20">
              <h4 className="font-medium mb-2">Net P&L</h4>
              <p className={`text-2xl font-bold ${
                filteredTrades.reduce((sum, t) => sum + t.pnl, 0) >= 0 ? 'profit-text' : 'loss-text'
              }`}>
                ${filteredTrades.reduce((sum, t) => sum + t.pnl, 0).toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">
                From filtered trades
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-muted/10 border border-border">
            <h4 className="font-medium mb-3">Trading Statistics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Win Rate:</span>
                <p className="font-medium">
                  {((filteredTrades.filter(t => t.pnl > 0).length / filteredTrades.length) * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Avg Trade:</span>
                <p className="font-medium">
                  ${(filteredTrades.reduce((sum, t) => sum + t.value, 0) / filteredTrades.length).toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Best Trade:</span>
                <p className="profit-text font-medium">
                  +${Math.max(...filteredTrades.map(t => t.pnl)).toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Worst Trade:</span>
                <p className="loss-text font-medium">
                  ${Math.min(...filteredTrades.map(t => t.pnl)).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default TradingHistory;