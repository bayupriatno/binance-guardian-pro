import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  DollarSign,
  Volume2,
  Clock
} from 'lucide-react';

interface CryptoPrice {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
}

const MarketData = () => {
  const [cryptoPrices, setCryptoPrices] = useState<CryptoPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Mock data for demonstration - in real app, this would fetch from Binance API
  const generateMockData = (): CryptoPrice[] => {
    const symbols = [
      { symbol: 'BTCUSDT', basePrice: 43000 },
      { symbol: 'ETHUSDT', basePrice: 2600 },
      { symbol: 'BNBUSDT', basePrice: 300 },
      { symbol: 'ADAUSDT', basePrice: 0.45 },
      { symbol: 'DOTUSDT', basePrice: 7.2 },
      { symbol: 'LINKUSDT', basePrice: 14.5 },
      { symbol: 'LTCUSDT', basePrice: 72 },
      { symbol: 'XRPUSDT', basePrice: 0.62 },
    ];

    return symbols.map(({ symbol, basePrice }) => {
      const changePercent = (Math.random() - 0.5) * 10; // Random change between -5% and +5%
      const price = basePrice * (1 + changePercent / 100);
      const change24h = price * (changePercent / 100);
      const volume24h = Math.random() * 1000000000; // Random volume
      
      return {
        symbol,
        price,
        change24h,
        changePercent24h: changePercent,
        volume24h,
        high24h: price * (1 + Math.random() * 0.1),
        low24h: price * (1 - Math.random() * 0.1),
      };
    });
  };

  useEffect(() => {
    const fetchData = () => {
      setLoading(true);
      // Simulate API call delay
      setTimeout(() => {
        setCryptoPrices(generateMockData());
        setLastUpdated(new Date());
        setLoading(false);
      }, 1000);
    };

    fetchData();
    
    // Update every 5 seconds (in real app, use WebSocket)
    const interval = setInterval(fetchData, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number) => {
    if (price < 1) return price.toFixed(4);
    if (price < 100) return price.toFixed(2);
    return price.toFixed(0);
  };

  const formatVolume = (volume: number) => {
    if (volume > 1000000000) return `${(volume / 1000000000).toFixed(1)}B`;
    if (volume > 1000000) return `${(volume / 1000000).toFixed(1)}M`;
    if (volume > 1000) return `${(volume / 1000).toFixed(1)}K`;
    return volume.toFixed(0);
  };

  if (loading && cryptoPrices.length === 0) {
    return (
      <Card className="trading-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Activity className="w-5 h-5 mr-2 text-primary" />
            Market Data
          </h3>
          <Badge variant="secondary">Loading...</Badge>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-secondary rounded-full" />
                <div className="space-y-1">
                  <div className="w-16 h-4 bg-secondary rounded" />
                  <div className="w-12 h-3 bg-secondary rounded" />
                </div>
              </div>
              <div className="text-right space-y-1">
                <div className="w-20 h-4 bg-secondary rounded" />
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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Activity className="w-5 h-5 mr-2 text-primary" />
          Market Data
        </h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      <div className="space-y-3">
        {cryptoPrices.map((crypto) => (
          <div
            key={crypto.symbol}
            className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{crypto.symbol}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Volume2 className="w-3 h-3" />
                  <span>{formatVolume(crypto.volume24h)}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <p className="font-bold">${formatPrice(crypto.price)}</p>
              <div className="flex items-center gap-1 justify-end">
                {crypto.changePercent24h >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-profit" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-loss" />
                )}
                <span className={`text-xs font-medium ${
                  crypto.changePercent24h >= 0 ? 'profit-text' : 'loss-text'
                }`}>
                  {crypto.changePercent24h >= 0 ? '+' : ''}{crypto.changePercent24h.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 rounded-lg bg-muted/10 border border-border">
        <p className="text-xs text-muted-foreground text-center">
          Market data updates every 5 seconds • Demo mode with simulated prices
        </p>
      </div>
    </Card>
  );
};

export default MarketData;