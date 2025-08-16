import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Bot, 
  TrendingUp, 
  Grid3X3, 
  BarChart3, 
  DollarSign,
  Shield,
  Settings,
  Play,
  Save
} from 'lucide-react';

interface BotConfigProps {
  onClose: () => void;
  editBot?: any;
}

const BotConfiguration: React.FC<BotConfigProps> = ({ onClose, editBot }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [botName, setBotName] = useState(editBot?.name || '');
  const [strategy, setStrategy] = useState(editBot?.strategy || 'dca');
  const [tradingPair, setTradingPair] = useState('BTCUSDT');
  const [baseAmount, setBaseAmount] = useState(100);
  const [maxActiveDeals, setMaxActiveDeals] = useState(1);
  const [riskLevel, setRiskLevel] = useState([50]);
  const [enableStopLoss, setEnableStopLoss] = useState(true);
  const [stopLossPercent, setStopLossPercent] = useState(5);
  const [takeProfitPercent, setTakeProfitPercent] = useState(10);

  // DCA specific settings
  const [dcaOrderSize, setDcaOrderSize] = useState(50);
  const [dcaStepPercent, setDcaStepPercent] = useState(2);
  const [maxDcaOrders, setMaxDcaOrders] = useState(5);

  // Grid specific settings
  const [gridLower, setGridLower] = useState(30000);
  const [gridUpper, setGridUpper] = useState(50000);
  const [gridLevels, setGridLevels] = useState(10);

  const strategies = [
    { value: 'dca', label: 'DCA Bot', icon: TrendingUp, description: 'Dollar Cost Averaging strategy' },
    { value: 'grid', label: 'Grid Bot', icon: Grid3X3, description: 'Grid trading with multiple orders' },
    { value: 'momentum', label: 'Momentum', icon: BarChart3, description: 'Trend following strategy' },
  ];

  const tradingPairs = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'DOTUSDT', 
    'LINKUSDT', 'LTCUSDT', 'BCHUSDT', 'XLMUSDT', 'XRPUSDT'
  ];

  const handleSaveBot = async () => {
    if (!botName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a bot name",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const config = {
        tradingPair,
        baseAmount,
        maxActiveDeals,
        riskLevel: riskLevel[0],
        enableStopLoss,
        stopLossPercent,
        takeProfitPercent,
        ...(strategy === 'dca' && {
          dcaOrderSize,
          dcaStepPercent,
          maxDcaOrders,
        }),
        ...(strategy === 'grid' && {
          gridLower,
          gridUpper,
          gridLevels,
        }),
      };

      if (editBot) {
        const { error } = await supabase
          .from('trading_bots')
          .update({
            name: botName,
            strategy,
            config,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editBot.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('trading_bots')
          .insert({
            user_id: user.id,
            name: botName,
            strategy,
            config,
            status: 'inactive',
          });

        if (error) throw error;
      }

      toast({
        title: "Success!",
        description: `Bot ${editBot ? 'updated' : 'created'} successfully`,
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedStrategy = strategies.find(s => s.value === strategy);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="trading-card w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {editBot ? 'Edit Trading Bot' : 'Create New Trading Bot'}
                </h2>
                <p className="text-muted-foreground">Configure your automated trading strategy</p>
              </div>
            </div>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Basic Configuration */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-4 bg-secondary/20">
                <h3 className="font-semibold mb-4 flex items-center">
                  <Settings className="w-4 h-4 mr-2" />
                  Basic Configuration
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="botName">Bot Name</Label>
                    <Input
                      id="botName"
                      value={botName}
                      onChange={(e) => setBotName(e.target.value)}
                      placeholder="My Trading Bot"
                    />
                  </div>

                  <div>
                    <Label htmlFor="tradingPair">Trading Pair</Label>
                    <Select value={tradingPair} onValueChange={setTradingPair}>
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

                  <div>
                    <Label htmlFor="baseAmount">Base Amount (USDT)</Label>
                    <Input
                      id="baseAmount"
                      type="number"
                      value={baseAmount}
                      onChange={(e) => setBaseAmount(Number(e.target.value))}
                      min="10"
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxDeals">Max Active Deals</Label>
                    <Input
                      id="maxDeals"
                      type="number"
                      value={maxActiveDeals}
                      onChange={(e) => setMaxActiveDeals(Number(e.target.value))}
                      min="1"
                      max="10"
                    />
                  </div>
                </div>
              </Card>

              {/* Strategy Selection */}
              <Card className="p-4 bg-secondary/20">
                <h3 className="font-semibold mb-4">Strategy Selection</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {strategies.map((strat) => (
                    <div
                      key={strat.value}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        strategy === strat.value
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setStrategy(strat.value)}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <strat.icon className="w-5 h-5 text-primary" />
                        <span className="font-medium">{strat.label}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{strat.description}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Strategy-specific Configuration */}
              <Card className="p-4 bg-secondary/20">
                <h3 className="font-semibold mb-4 flex items-center">
                  {selectedStrategy?.icon && <selectedStrategy.icon className="w-4 h-4 mr-2" />}
                  {selectedStrategy?.label} Configuration
                </h3>

                <Tabs defaultValue={strategy} value={strategy}>
                  <TabsContent value="dca" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>DCA Order Size (USDT)</Label>
                        <Input
                          type="number"
                          value={dcaOrderSize}
                          onChange={(e) => setDcaOrderSize(Number(e.target.value))}
                          min="10"
                        />
                      </div>
                      <div>
                        <Label>DCA Step (%)</Label>
                        <Input
                          type="number"
                          value={dcaStepPercent}
                          onChange={(e) => setDcaStepPercent(Number(e.target.value))}
                          min="0.5"
                          step="0.5"
                        />
                      </div>
                      <div>
                        <Label>Max DCA Orders</Label>
                        <Input
                          type="number"
                          value={maxDcaOrders}
                          onChange={(e) => setMaxDcaOrders(Number(e.target.value))}
                          min="1"
                          max="20"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="grid" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Lower Price (USDT)</Label>
                        <Input
                          type="number"
                          value={gridLower}
                          onChange={(e) => setGridLower(Number(e.target.value))}
                          min="1"
                        />
                      </div>
                      <div>
                        <Label>Upper Price (USDT)</Label>
                        <Input
                          type="number"
                          value={gridUpper}
                          onChange={(e) => setGridUpper(Number(e.target.value))}
                          min="1"
                        />
                      </div>
                      <div>
                        <Label>Grid Levels</Label>
                        <Input
                          type="number"
                          value={gridLevels}
                          onChange={(e) => setGridLevels(Number(e.target.value))}
                          min="3"
                          max="50"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="momentum" className="space-y-4">
                    <div className="text-center p-8 text-muted-foreground">
                      <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Momentum strategy uses advanced algorithms</p>
                      <p>Default settings will be applied</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </Card>
            </div>

            {/* Risk Management */}
            <div className="space-y-6">
              <Card className="p-4 bg-secondary/20">
                <h3 className="font-semibold mb-4 flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  Risk Management
                </h3>

                <div className="space-y-4">
                  <div>
                    <Label>Risk Level</Label>
                    <div className="mt-2">
                      <Slider
                        value={riskLevel}
                        onValueChange={setRiskLevel}
                        max={100}
                        step={1}
                        className="mb-2"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Conservative</span>
                        <span>{riskLevel[0]}%</span>
                        <span>Aggressive</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="enableStopLoss">Enable Stop Loss</Label>
                    <Switch
                      id="enableStopLoss"
                      checked={enableStopLoss}
                      onCheckedChange={setEnableStopLoss}
                    />
                  </div>

                  {enableStopLoss && (
                    <div>
                      <Label>Stop Loss (%)</Label>
                      <Input
                        type="number"
                        value={stopLossPercent}
                        onChange={(e) => setStopLossPercent(Number(e.target.value))}
                        min="1"
                        max="50"
                        step="0.5"
                      />
                    </div>
                  )}

                  <div>
                    <Label>Take Profit (%)</Label>
                    <Input
                      type="number"
                      value={takeProfitPercent}
                      onChange={(e) => setTakeProfitPercent(Number(e.target.value))}
                      min="1"
                      max="100"
                      step="0.5"
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-secondary/20">
                <h3 className="font-semibold mb-4">Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Strategy:</span>
                    <Badge variant="secondary">{selectedStrategy?.label}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Pair:</span>
                    <span>{tradingPair}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Base Amount:</span>
                    <span>${baseAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Risk Level:</span>
                    <span>{riskLevel[0]}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stop Loss:</span>
                    <span>{enableStopLoss ? `${stopLossPercent}%` : 'Disabled'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Take Profit:</span>
                    <span>{takeProfitPercent}%</span>
                  </div>
                </div>
              </Card>

              <div className="space-y-3">
                <Button
                  onClick={handleSaveBot}
                  disabled={loading}
                  variant="premium"
                  className="w-full"
                >
                  {loading ? 'Saving...' : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {editBot ? 'Update Bot' : 'Create Bot'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BotConfiguration;