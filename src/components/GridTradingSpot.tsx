import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Grid3X3, 
  Play, 
  Pause, 
  Settings,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpDown
} from 'lucide-react';

interface GridBot {
  id?: string;
  name: string;
  symbol: string;
  lowerPrice: number;
  upperPrice: number;
  gridLevels: number;
  totalInvestment: number;
  orderSize: number;
  status: 'active' | 'inactive' | 'paused';
  created_at?: string;
  config?: any;
}

const GridTradingSpot = () => {
  const { toast } = useToast();
  const [gridBots, setGridBots] = useState<GridBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [botName, setBotName] = useState('');
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [lowerPrice, setLowerPrice] = useState(30000);
  const [upperPrice, setUpperPrice] = useState(50000);
  const [gridLevels, setGridLevels] = useState([10]);
  const [totalInvestment, setTotalInvestment] = useState(1000);
  const [arithmeticMode, setArithmeticMode] = useState(true);

  const tradingPairs = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'DOTUSDT',
    'LINKUSDT', 'LTCUSDT', 'XRPUSDT', 'SOLUSDT', 'MATICUSDT'
  ];

  useEffect(() => {
    loadGridBots();
  }, []);

  const loadGridBots = async () => {
    try {
      const { data, error } = await supabase
        .from('trading_bots')
        .select('*')
        .eq('strategy', 'grid')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGridBots((data || []).map(bot => {
        const config = bot.config as any;
        return {
          ...bot,
          status: (bot.status as 'active' | 'inactive' | 'paused') || 'inactive',
          symbol: config?.symbol || 'BTCUSDT',
          lowerPrice: config?.lowerPrice || 0,
          upperPrice: config?.upperPrice || 0,
          gridLevels: config?.gridLevels || 10,
          totalInvestment: config?.totalInvestment || 0,
          orderSize: config?.orderSize || 0
        };
      }));
    } catch (error: any) {
      toast({
        title: "Error loading grid bots",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateGridParams = () => {
    const levels = gridLevels[0];
    const priceRange = upperPrice - lowerPrice;
    const gridStep = priceRange / (levels - 1);
    const orderSize = totalInvestment / (levels / 2); // Half for buy orders

    return {
      gridStep: gridStep.toFixed(2),
      orderSize: orderSize.toFixed(2),
      buyOrders: Math.floor(levels / 2),
      sellOrders: Math.ceil(levels / 2),
      profitPerGrid: ((gridStep / lowerPrice) * 100).toFixed(3)
    };
  };

  const createGridBot = async () => {
    if (!botName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a bot name",
        variant: "destructive",
      });
      return;
    }

    if (upperPrice <= lowerPrice) {
      toast({
        title: "Error", 
        description: "Upper price must be higher than lower price",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const gridParams = calculateGridParams();
      const config = {
        symbol,
        lowerPrice,
        upperPrice,
        gridLevels: gridLevels[0],
        totalInvestment,
        orderSize: parseFloat(gridParams.orderSize),
        arithmeticMode,
        gridStep: parseFloat(gridParams.gridStep),
        marketType: 'spot',
        profitPerGrid: parseFloat(gridParams.profitPerGrid),
        autoRestart: true,
        stopLoss: false,
        takeProfit: false
      };

      const { error } = await supabase
        .from('trading_bots')
        .insert({
          user_id: user.id,
          name: botName,
          strategy: 'grid',
          config,
          status: 'inactive'
        });

      if (error) throw error;

      toast({
        title: "Grid Bot Created",
        description: "Your spot grid trading bot has been created successfully",
      });

      resetForm();
      loadGridBots();
    } catch (error: any) {
      toast({
        title: "Error creating bot",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const toggleBot = async (botId: string, newStatus: 'active' | 'paused') => {
    try {
      const { error } = await supabase
        .from('trading_bots')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', botId);

      if (error) throw error;

      toast({
        title: `Bot ${newStatus}`,
        description: `Grid bot has been ${newStatus}`,
      });

      loadGridBots();
    } catch (error: any) {
      toast({
        title: "Error updating bot",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setBotName('');
    setSymbol('BTCUSDT');
    setLowerPrice(30000);
    setUpperPrice(50000);
    setGridLevels([10]);
    setTotalInvestment(1000);
    setArithmeticMode(true);
    setShowCreateForm(false);
  };

  const gridParams = calculateGridParams();

  if (loading) {
    return (
      <Card className="trading-card">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-secondary rounded w-1/3"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-secondary/50 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="trading-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Grid3X3 className="w-5 h-5 text-primary" />
              Spot Grid Trading
            </CardTitle>
            <Button 
              variant="premium"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              Create Grid Bot
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {showCreateForm && (
            <Card className="p-4 bg-secondary/20 border-primary/20">
              <h4 className="font-semibold mb-4">Create New Spot Grid Bot</h4>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Bot Name</Label>
                      <Input
                        value={botName}
                        onChange={(e) => setBotName(e.target.value)}
                        placeholder="My Grid Bot"
                      />
                    </div>
                    <div>
                      <Label>Trading Pair</Label>
                      <Select value={symbol} onValueChange={setSymbol}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {tradingPairs.map(pair => (
                            <SelectItem key={pair} value={pair}>{pair}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Lower Price (USDT)</Label>
                      <Input
                        type="number"
                        value={lowerPrice}
                        onChange={(e) => setLowerPrice(Number(e.target.value))}
                        min="0.001"
                        step="0.001"
                      />
                    </div>
                    <div>
                      <Label>Upper Price (USDT)</Label>
                      <Input
                        type="number"
                        value={upperPrice}
                        onChange={(e) => setUpperPrice(Number(e.target.value))}
                        min="0.001"
                        step="0.001"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Grid Levels: {gridLevels[0]}</Label>
                    <Slider
                      value={gridLevels}
                      onValueChange={setGridLevels}
                      min={3}
                      max={100}
                      step={1}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>3</span>
                      <span>100</span>
                    </div>
                  </div>

                  <div>
                    <Label>Total Investment (USDT)</Label>
                    <Input
                      type="number"
                      value={totalInvestment}
                      onChange={(e) => setTotalInvestment(Number(e.target.value))}
                      min="10"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Arithmetic Progression</Label>
                    <Switch
                      checked={arithmeticMode}
                      onCheckedChange={setArithmeticMode}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Card className="p-4 bg-secondary/30">
                    <h5 className="font-medium mb-3">Grid Calculation</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Grid Step:</span>
                        <span className="font-mono">${gridParams.gridStep}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Order Size:</span>
                        <span className="font-mono">${gridParams.orderSize}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Buy Orders:</span>
                        <span className="text-green-500">{gridParams.buyOrders}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sell Orders:</span>
                        <span className="text-red-500">{gridParams.sellOrders}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Profit Per Grid:</span>
                        <span className="profit-text">{gridParams.profitPerGrid}%</span>
                      </div>
                    </div>
                  </Card>

                  <div className="flex gap-3">
                    <Button 
                      onClick={createGridBot}
                      disabled={creating}
                      variant="premium"
                      className="flex-1"
                    >
                      {creating ? 'Creating...' : 'Create Bot'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={resetForm}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Grid Bots List */}
          <div className="space-y-4">
            <h4 className="font-medium">Your Spot Grid Bots</h4>
            
            {gridBots.map((bot) => (
              <Card key={bot.id} className={`p-4 transition-all ${
                bot.status === 'active' 
                  ? 'bg-primary/5 border-primary/30' 
                  : 'bg-secondary/20'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`p-3 rounded-lg ${
                      bot.status === 'active' ? 'bg-primary/20' : 'bg-secondary/30'
                    }`}>
                      <Grid3X3 className={`w-6 h-6 ${
                        bot.status === 'active' ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-semibold">{bot.name}</h5>
                        <Badge variant={bot.status === 'active' ? 'default' : 'secondary'}>
                          {bot.status}
                        </Badge>
                        <Badge variant="outline">{bot.config?.symbol || bot.symbol}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Range:</span>
                          <div className="font-mono text-xs">
                            ${bot.config?.lowerPrice || bot.lowerPrice} - ${bot.config?.upperPrice || bot.upperPrice}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Levels:</span>
                          <span className="ml-1 font-medium">{bot.config?.gridLevels || bot.gridLevels}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Investment:</span>
                          <span className="ml-1 font-medium">${bot.config?.totalInvestment || bot.totalInvestment}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Profit:</span>
                          <span className="ml-1 font-medium profit-text">+$0.00</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      <Settings className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant={bot.status === 'active' ? "destructive" : "default"}
                      onClick={() => toggleBot(bot.id!, bot.status === 'active' ? 'paused' : 'active')}
                    >
                      {bot.status === 'active' ? (
                        <>
                          <Pause className="w-4 h-4 mr-1" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-1" />
                          Start
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {gridBots.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Grid3X3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No spot grid bots yet</p>
                <p className="text-sm">Create your first grid bot to start automated spot trading</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GridTradingSpot;