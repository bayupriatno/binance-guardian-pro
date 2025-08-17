import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Zap, 
  TrendingUp, 
  Grid3X3, 
  BarChart3,
  ArrowRightLeft,
  Target,
  Plus,
  Play,
  Pause,
  Settings,
  LineChart
} from 'lucide-react';

interface Strategy {
  id: string;
  name: string;
  description?: string;
  strategy_type: 'dca' | 'grid' | 'momentum' | 'arbitrage' | 'scalping';
  config: any;
  active: boolean;
  performance: any;
  created_at: string;
}

const AutomatedStrategies = () => {
  const { toast } = useToast();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewStrategy, setShowNewStrategy] = useState(false);
  
  // New strategy form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [strategyType, setStrategyType] = useState<'dca' | 'grid' | 'momentum' | 'arbitrage' | 'scalping'>('dca');
  const [submitting, setSubmitting] = useState(false);

  const strategyTypes = [
    { 
      value: 'dca', 
      label: 'Dollar Cost Averaging', 
      icon: TrendingUp, 
      description: 'Gradual position building with fixed intervals',
      color: 'text-blue-500'
    },
    { 
      value: 'grid', 
      label: 'Grid Trading', 
      icon: Grid3X3, 
      description: 'Place multiple buy/sell orders in a grid pattern',
      color: 'text-green-500'
    },
    { 
      value: 'momentum', 
      label: 'Momentum Trading', 
      icon: BarChart3, 
      description: 'Follow strong price trends and breakouts',
      color: 'text-purple-500'
    },
    { 
      value: 'arbitrage', 
      label: 'Arbitrage', 
      icon: ArrowRightLeft, 
      description: 'Exploit price differences between markets',
      color: 'text-orange-500'
    },
    { 
      value: 'scalping', 
      label: 'Scalping', 
      icon: Target, 
      description: 'Quick trades for small profits',
      color: 'text-red-500'
    },
  ];

  useEffect(() => {
    loadStrategies();
  }, []);

  const loadStrategies = async () => {
    try {
      const { data, error } = await supabase
        .from('trading_strategies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStrategies((data || []) as Strategy[]);
    } catch (error: any) {
      toast({
        title: "Error loading strategies",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createStrategy = async () => {
    if (!name.trim()) {
      toast({
        title: "Invalid strategy",
        description: "Please enter a strategy name",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const defaultConfig = {
        dca: {
          symbol: 'BTCUSDT',
          orderSize: 100,
          interval: '1h',
          maxOrders: 10,
          priceThreshold: 2
        },
        grid: {
          symbol: 'BTCUSDT',
          lowerPrice: 30000,
          upperPrice: 50000,
          gridLevels: 10,
          orderSize: 50
        },
        momentum: {
          symbol: 'BTCUSDT',
          rsiPeriod: 14,
          rsiOverbought: 70,
          rsiOversold: 30,
          stopLoss: 3,
          takeProfit: 6
        },
        arbitrage: {
          symbols: ['BTCUSDT', 'ETHUSDT'],
          minSpread: 0.5,
          maxSpread: 2,
          orderSize: 100
        },
        scalping: {
          symbol: 'BTCUSDT',
          quickProfitTarget: 0.2,
          stopLoss: 0.1,
          orderSize: 50,
          maxHoldTime: '5m'
        }
      };

      const strategyData = {
        user_id: user.id,
        name,
        description: description || null,
        strategy_type: strategyType,
        config: defaultConfig[strategyType],
        active: false,
        performance: {
          totalTrades: 0,
          winRate: 0,
          totalProfit: 0,
          avgProfit: 0,
          lastUpdated: new Date().toISOString()
        }
      };

      const { error } = await supabase
        .from('trading_strategies')
        .insert(strategyData);

      if (error) throw error;

      toast({
        title: "Strategy created",
        description: "Your automated strategy has been created successfully",
      });

      // Reset form
      setName('');
      setDescription('');
      setShowNewStrategy(false);
      
      // Reload strategies
      loadStrategies();
    } catch (error: any) {
      toast({
        title: "Error creating strategy",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStrategy = async (strategyId: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('trading_strategies')
        .update({ 
          active,
          updated_at: new Date().toISOString()
        })
        .eq('id', strategyId);

      if (error) throw error;

      loadStrategies();
      
      toast({
        title: active ? "Strategy activated" : "Strategy paused",
        description: `Strategy has been ${active ? 'activated' : 'paused'}`,
      });
    } catch (error: any) {
      toast({
        title: "Error updating strategy",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteStrategy = async (strategyId: string) => {
    try {
      const { error } = await supabase
        .from('trading_strategies')
        .delete()
        .eq('id', strategyId);

      if (error) throw error;

      loadStrategies();
      
      toast({
        title: "Strategy deleted",
        description: "Strategy has been deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting strategy",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStrategyTypeInfo = (type: string) => {
    return strategyTypes.find(t => t.value === type) || strategyTypes[0];
  };

  const formatPerformance = (performance: any) => {
    if (!performance || typeof performance !== 'object') {
      return { totalTrades: 0, winRate: 0, totalProfit: 0 };
    }
    return {
      totalTrades: performance.totalTrades || 0,
      winRate: performance.winRate || 0,
      totalProfit: performance.totalProfit || 0
    };
  };

  if (loading) {
    return (
      <Card className="trading-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-secondary rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-secondary/50 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="trading-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold flex items-center">
            <Zap className="w-5 h-5 mr-2 text-primary" />
            Automated Trading Strategies
          </h3>
          <Button 
            variant="premium" 
            onClick={() => setShowNewStrategy(!showNewStrategy)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Strategy
          </Button>
        </div>

        {showNewStrategy && (
          <Card className="p-4 mb-6 bg-secondary/20 border-primary/20">
            <h4 className="font-semibold mb-4">Create New Strategy</h4>
            
            {/* Strategy Type Selection */}
            <div className="mb-4">
              <Label className="mb-2 block">Strategy Type</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {strategyTypes.map((strategy) => (
                  <div
                    key={strategy.value}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      strategyType === strategy.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setStrategyType(strategy.value as any)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <strategy.icon className={`w-5 h-5 ${strategy.color}`} />
                      <span className="font-medium">{strategy.label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{strategy.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Strategy Name</Label>
                <Input
                  placeholder="My DCA Strategy"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <Label>Description (Optional)</Label>
                <Input
                  placeholder="Strategy description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <Button 
                onClick={createStrategy}
                disabled={submitting}
                variant="premium"
                className="flex-1"
              >
                {submitting ? 'Creating...' : 'Create Strategy'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowNewStrategy(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {/* Strategies List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Your Strategies</h4>
            <Badge variant="secondary">
              {strategies.filter(s => s.active).length} active
            </Badge>
          </div>

          {strategies.map((strategy) => {
            const typeInfo = getStrategyTypeInfo(strategy.strategy_type);
            const performance = formatPerformance(strategy.performance);
            
            return (
              <Card key={strategy.id} className={`p-4 transition-all ${
                strategy.active 
                  ? 'bg-primary/5 border-primary/30' 
                  : 'bg-secondary/20'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`p-3 rounded-lg ${
                      strategy.active ? 'bg-primary/20' : 'bg-secondary/30'
                    }`}>
                      <typeInfo.icon className={`w-6 h-6 ${
                        strategy.active ? 'text-primary' : typeInfo.color
                      }`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-semibold">{strategy.name}</h5>
                        {strategy.active && (
                          <Badge variant="default" className="animate-pulse-glow">
                            Active
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {typeInfo.label}
                        </Badge>
                      </div>
                      
                      {strategy.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {strategy.description}
                        </p>
                      )}
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Trades:</span>
                          <span className="ml-1 font-medium">{performance.totalTrades}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Win Rate:</span>
                          <span className="ml-1 font-medium">{performance.winRate}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Profit:</span>
                          <span className={`ml-1 font-medium ${
                            performance.totalProfit >= 0 ? 'profit-text' : 'loss-text'
                          }`}>
                            {performance.totalProfit >= 0 ? '+' : ''}${performance.totalProfit.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {strategy.active && performance.winRate > 0 && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Performance</span>
                            <span>{performance.winRate}%</span>
                          </div>
                          <Progress value={performance.winRate} className="h-1" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        toast({
                          title: "Strategy Configuration",
                          description: "Strategy configuration panel will be available soon",
                        });
                      }}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant={strategy.active ? "destructive" : "default"}
                      onClick={() => toggleStrategy(strategy.id, !strategy.active)}
                    >
                      {strategy.active ? (
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
            );
          })}

          {strategies.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No automated strategies yet</p>
              <p className="text-sm">Create your first strategy to start automated trading</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AutomatedStrategies;