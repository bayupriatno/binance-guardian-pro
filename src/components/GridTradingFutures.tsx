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
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Zap
} from 'lucide-react';

interface FuturesGridBot {
  id?: string;
  name: string;
  symbol: string;
  lowerPrice: number;
  upperPrice: number;
  gridLevels: number;
  totalInvestment: number;
  leverage: number;
  positionSide: 'LONG' | 'SHORT' | 'BOTH';
  status: 'active' | 'inactive' | 'paused';
  created_at?: string;
  config?: any;
}

const GridTradingFutures = () => {
  const { toast } = useToast();
  const [futuresGridBots, setFuturesGridBots] = useState<FuturesGridBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [botName, setBotName] = useState('');
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [lowerPrice, setLowerPrice] = useState(30000);
  const [upperPrice, setUpperPrice] = useState(50000);
  const [gridLevels, setGridLevels] = useState([15]);
  const [totalInvestment, setTotalInvestment] = useState(1000);
  const [leverage, setLeverage] = useState([10]);
  const [positionSide, setPositionSide] = useState<'LONG' | 'SHORT' | 'BOTH'>('BOTH');
  const [hedgeMode, setHedgeMode] = useState(true);
  const [autoCompound, setAutoCompound] = useState(false);

  const futuresPairs = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'DOTUSDT',
    'LINKUSDT', 'LTCUSDT', 'XRPUSDT', 'SOLUSDT', 'MATICUSDT',
    'AVAXUSDT', 'FTMUSDT', 'ATOMUSDT', 'NEARUSDT', 'SANDUSDT'
  ];

  const leverageOptions = [1, 2, 3, 5, 10, 15, 20, 25, 50, 75, 100, 125];

  useEffect(() => {
    loadFuturesGridBots();
  }, []);

  const loadFuturesGridBots = async () => {
    try {
      const { data, error } = await supabase
        .from('trading_bots')
        .select('*')
        .eq('strategy', 'futures_grid')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFuturesGridBots((data || []).map(bot => {
        const config = bot.config as any;
        return {
          ...bot,
          status: (bot.status as 'active' | 'inactive' | 'paused') || 'inactive',
          symbol: config?.symbol || 'BTCUSDT',
          lowerPrice: config?.lowerPrice || 0,
          upperPrice: config?.upperPrice || 0,
          gridLevels: config?.gridLevels || 10,
          totalInvestment: config?.totalInvestment || 0,
          leverage: config?.leverage || 1,
          positionSide: config?.positionSide || 'BOTH'
        };
      }));
    } catch (error: any) {
      toast({
        title: "Error loading futures grid bots",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateFuturesGridParams = () => {
    const levels = gridLevels[0];
    const priceRange = upperPrice - lowerPrice;
    const gridStep = priceRange / (levels - 1);
    const leverageAmount = leverage[0];
    const effectiveInvestment = totalInvestment * leverageAmount;
    const orderSize = effectiveInvestment / (levels / 2);
    const marginRequired = totalInvestment / leverageAmount;

    return {
      gridStep: gridStep.toFixed(2),
      orderSize: orderSize.toFixed(2),
      marginRequired: marginRequired.toFixed(2),
      effectiveInvestment: effectiveInvestment.toFixed(2),
      buyOrders: Math.floor(levels / 2),
      sellOrders: Math.ceil(levels / 2),
      profitPerGrid: ((gridStep / lowerPrice) * 100 * leverageAmount).toFixed(3),
      riskLevel: leverageAmount > 20 ? 'High' : leverageAmount > 10 ? 'Medium' : 'Low'
    };
  };

  const createFuturesGridBot = async () => {
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

      const gridParams = calculateFuturesGridParams();
      const config = {
        symbol,
        lowerPrice,
        upperPrice,
        gridLevels: gridLevels[0],
        totalInvestment,
        leverage: leverage[0],
        positionSide,
        hedgeMode,
        autoCompound,
        orderSize: parseFloat(gridParams.orderSize),
        gridStep: parseFloat(gridParams.gridStep),
        marginRequired: parseFloat(gridParams.marginRequired),
        effectiveInvestment: parseFloat(gridParams.effectiveInvestment),
        marketType: 'futures',
        profitPerGrid: parseFloat(gridParams.profitPerGrid),
        riskLevel: gridParams.riskLevel,
        stopLoss: true,
        stopLossPercent: 5,
        takeProfit: false,
        autoRestart: true
      };

      const { error } = await supabase
        .from('trading_bots')
        .insert({
          user_id: user.id,
          name: botName,
          strategy: 'futures_grid',
          config,
          status: 'inactive'
        });

      if (error) throw error;

      toast({
        title: "Futures Grid Bot Created",
        description: "Your futures grid trading bot has been created successfully",
      });

      resetForm();
      loadFuturesGridBots();
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
        description: `Futures grid bot has been ${newStatus}`,
      });

      loadFuturesGridBots();
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
    setGridLevels([15]);
    setTotalInvestment(1000);
    setLeverage([10]);
    setPositionSide('BOTH');
    setHedgeMode(true);
    setAutoCompound(false);
    setShowCreateForm(false);
  };

  const gridParams = calculateFuturesGridParams();

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
              <Zap className="w-5 h-5 text-primary" />
              Futures Grid Trading
              <Badge variant="destructive" className="ml-2">
                <AlertTriangle className="w-3 h-3 mr-1" />
                High Risk
              </Badge>
            </CardTitle>
            <Button 
              variant="premium"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              Create Futures Grid Bot
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {showCreateForm && (
            <Card className="p-4 bg-secondary/20 border-primary/20">
              <h4 className="font-semibold mb-4">Create New Futures Grid Bot</h4>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Bot Name</Label>
                      <Input
                        value={botName}
                        onChange={(e) => setBotName(e.target.value)}
                        placeholder="My Futures Grid Bot"
                      />
                    </div>
                    <div>
                      <Label>Trading Pair</Label>
                      <Select value={symbol} onValueChange={setSymbol}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {futuresPairs.map(pair => (
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
                      min={5}
                      max={50}
                      step={1}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>5</span>
                      <span>50</span>
                    </div>
                  </div>

                  <div>
                    <Label>Leverage: {leverage[0]}x</Label>
                    <Slider
                      value={leverage}
                      onValueChange={setLeverage}
                      min={1}
                      max={125}
                      step={1}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>1x</span>
                      <span className="text-destructive">125x</span>
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

                  <div>
                    <Label>Position Side</Label>
                    <Select value={positionSide} onValueChange={(value: any) => setPositionSide(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LONG">
                          <div className="flex items-center">
                            <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                            Long Only
                          </div>
                        </SelectItem>
                        <SelectItem value="SHORT">
                          <div className="flex items-center">
                            <TrendingDown className="w-4 h-4 mr-2 text-red-500" />
                            Short Only
                          </div>
                        </SelectItem>
                        <SelectItem value="BOTH">
                          <div className="flex items-center">
                            <Grid3X3 className="w-4 h-4 mr-2 text-primary" />
                            Both Directions
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Hedge Mode</Label>
                    <Switch
                      checked={hedgeMode}
                      onCheckedChange={setHedgeMode}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Auto Compound</Label>
                    <Switch
                      checked={autoCompound}
                      onCheckedChange={setAutoCompound}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Card className="p-4 bg-secondary/30">
                    <h5 className="font-medium mb-3">Futures Grid Calculation</h5>
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
                        <span>Margin Required:</span>
                        <span className="font-mono">${gridParams.marginRequired}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Effective Investment:</span>
                        <span className="font-mono">${gridParams.effectiveInvestment}</span>
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
                      <div className="flex justify-between">
                        <span>Risk Level:</span>
                        <Badge variant={
                          gridParams.riskLevel === 'High' ? 'destructive' : 
                          gridParams.riskLevel === 'Medium' ? 'secondary' : 'default'
                        }>
                          {gridParams.riskLevel}
                        </Badge>
                      </div>
                    </div>
                  </Card>

                  {leverage[0] > 20 && (
                    <Card className="p-4 bg-destructive/10 border-destructive/30">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                        <span className="font-medium text-destructive">High Risk Warning</span>
                      </div>
                      <p className="text-sm text-destructive/80">
                        Using leverage above 20x significantly increases liquidation risk. 
                        Please ensure you understand the risks involved.
                      </p>
                    </Card>
                  )}

                  <div className="flex gap-3">
                    <Button 
                      onClick={createFuturesGridBot}
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

          {/* Futures Grid Bots List */}
          <div className="space-y-4">
            <h4 className="font-medium">Your Futures Grid Bots</h4>
            
            {futuresGridBots.map((bot) => (
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
                      <Zap className={`w-6 h-6 ${
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
                        <Badge variant="destructive" className="text-xs">
                          {bot.config?.leverage || bot.leverage}x
                        </Badge>
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
                          <span className="text-muted-foreground">Margin:</span>
                          <span className="ml-1 font-medium">${bot.config?.marginRequired || (bot.totalInvestment / (bot.config?.leverage || 1)).toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">PnL:</span>
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

            {futuresGridBots.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No futures grid bots yet</p>
                <p className="text-sm">Create your first futures grid bot to start leveraged grid trading</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GridTradingFutures;