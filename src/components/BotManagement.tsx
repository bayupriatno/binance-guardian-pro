import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import BotConfiguration from './BotConfiguration';
import { 
  Bot, 
  Play, 
  Pause, 
  Trash2, 
  Edit, 
  TrendingUp, 
  TrendingDown,
  Activity,
  BarChart3,
  Settings,
  Plus,
  RefreshCw,
  DollarSign,
  Target,
  Calendar
} from 'lucide-react';

interface TradingBot {
  id: string;
  user_id: string;
  name: string;
  strategy: string;
  status: string;
  config: any;
  total_trades: number;
  total_profit: number;
  win_rate: number;
  created_at: string;
  updated_at: string;
}

const BotManagement = () => {
  const { toast } = useToast();
  const [bots, setBots] = useState<TradingBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [editingBot, setEditingBot] = useState<TradingBot | null>(null);
  const [selectedBot, setSelectedBot] = useState<TradingBot | null>(null);

  useEffect(() => {
    loadBots();
  }, []);

  const loadBots = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('trading_bots')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBots(data || []);
    } catch (error: any) {
      console.error('Error loading bots:', error);
      toast({
        title: "Error",
        description: "Failed to load trading bots",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleBotStatus = async (botId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      
      const { error } = await supabase
        .from('trading_bots')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', botId);

      if (error) throw error;

      await loadBots();
      
      toast({
        title: `Bot ${newStatus}`,
        description: `Trading bot has been ${newStatus}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteBot = async (botId: string) => {
    if (!confirm('Are you sure you want to delete this bot?')) return;

    try {
      const { error } = await supabase
        .from('trading_bots')
        .delete()
        .eq('id', botId);

      if (error) throw error;

      await loadBots();
      
      toast({
        title: "Bot deleted",
        description: "Trading bot has been deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStrategyIcon = (strategy: string) => {
    switch (strategy) {
      case 'dca': return TrendingUp;
      case 'grid': return BarChart3;
      case 'momentum': return Activity;
      default: return Bot;
    }
  };

  const getStrategyLabel = (strategy: string) => {
    switch (strategy) {
      case 'dca': return 'DCA Bot';
      case 'grid': return 'Grid Bot';
      case 'momentum': return 'Momentum';
      default: return strategy.toUpperCase();
    }
  };

  const formatDuration = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  if (loading) {
    return (
      <Card className="trading-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-secondary rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-secondary/50 rounded"></div>
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
          <div>
            <h3 className="text-2xl font-bold flex items-center">
              <Bot className="w-6 h-6 mr-3 text-primary" />
              Bot Management
            </h3>
            <p className="text-muted-foreground mt-1">
              Create and manage your automated trading bots
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={loadBots}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button 
              variant="premium" 
              onClick={() => {
                setEditingBot(null);
                setShowConfig(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Bot
            </Button>
          </div>
        </div>

        {/* Bot Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-secondary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Bots</p>
                <p className="text-2xl font-bold">{bots.length}</p>
              </div>
              <Bot className="w-8 h-8 text-primary" />
            </div>
          </div>

          <div className="p-4 rounded-lg bg-secondary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Bots</p>
                <p className="text-2xl font-bold text-profit">
                  {bots.filter(bot => bot.status === 'active').length}
                </p>
              </div>
              <Play className="w-8 h-8 text-profit" />
            </div>
          </div>

          <div className="p-4 rounded-lg bg-secondary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Trades</p>
                <p className="text-2xl font-bold">
                  {bots.reduce((sum, bot) => sum + (bot.total_trades || 0), 0)}
                </p>
              </div>
              <Activity className="w-8 h-8 text-primary" />
            </div>
          </div>

          <div className="p-4 rounded-lg bg-secondary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Profit</p>
                <p className={`text-2xl font-bold ${
                  bots.reduce((sum, bot) => sum + (bot.total_profit || 0), 0) >= 0 ? 'profit-text' : 'loss-text'
                }`}>
                  ${bots.reduce((sum, bot) => sum + (bot.total_profit || 0), 0).toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-primary" />
            </div>
          </div>
        </div>
      </Card>

      {/* Bots List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {bots.map((bot) => {
          const StrategyIcon = getStrategyIcon(bot.strategy);
          return (
            <Card 
              key={bot.id} 
              className={`trading-card p-6 cursor-pointer transition-all hover:scale-[1.02] ${
                bot.status === 'active' 
                  ? 'border-primary/50 bg-primary/5' 
                  : 'border-border'
              }`}
              onClick={() => setSelectedBot(bot)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${
                    bot.status === 'active' ? 'bg-primary/20' : 'bg-secondary/50'
                  }`}>
                    <StrategyIcon className={`w-6 h-6 ${
                      bot.status === 'active' ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{bot.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {getStrategyLabel(bot.strategy)}
                    </p>
                  </div>
                </div>
                
                <Badge 
                  variant={bot.status === 'active' ? 'default' : 'secondary'}
                  className={bot.status === 'active' ? 'animate-pulse-glow' : ''}
                >
                  {bot.status.toUpperCase()}
                </Badge>
              </div>

              {/* Bot Metrics */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Trades</p>
                  <p className="font-bold">{bot.total_trades || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  <p className="font-bold">{(bot.win_rate || 0).toFixed(1)}%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Profit</p>
                  <p className={`font-bold ${
                    (bot.total_profit || 0) >= 0 ? 'profit-text' : 'loss-text'
                  }`}>
                    {(bot.total_profit || 0) >= 0 ? '+' : ''}${(bot.total_profit || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Progress Bar for Win Rate */}
              {(bot.win_rate || 0) > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Performance</span>
                    <span>{(bot.win_rate || 0).toFixed(1)}%</span>
                  </div>
                  <Progress value={bot.win_rate || 0} className="h-2" />
                </div>
              )}

              {/* Bot Actions */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>Created {formatDuration(bot.created_at)}</span>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingBot(bot);
                      setShowConfig(true);
                    }}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant={bot.status === 'active' ? 'destructive' : 'default'}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBotStatus(bot.id, bot.status);
                    }}
                  >
                    {bot.status === 'active' ? (
                      <Pause className="w-3 h-3" />
                    ) : (
                      <Play className="w-3 h-3" />
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteBot(bot.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}

        {/* Empty State */}
        {bots.length === 0 && (
          <div className="lg:col-span-2">
            <Card className="trading-card p-12 text-center">
              <Bot className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-bold mb-2">No Trading Bots Yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first automated trading bot to get started
              </p>
              <Button 
                variant="premium"
                onClick={() => {
                  setEditingBot(null);
                  setShowConfig(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Bot
              </Button>
            </Card>
          </div>
        )}
      </div>

      {/* Bot Configuration Modal */}
      {showConfig && (
        <BotConfiguration
          editBot={editingBot}
          onClose={() => {
            setShowConfig(false);
            setEditingBot(null);
            loadBots();
          }}
        />
      )}

      {/* Bot Details Modal */}
      {selectedBot && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="trading-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-primary/20">
                    {React.createElement(getStrategyIcon(selectedBot.strategy), {
                      className: "w-6 h-6 text-primary"
                    })}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{selectedBot.name}</h3>
                    <p className="text-muted-foreground">
                      {getStrategyLabel(selectedBot.strategy)} Strategy
                    </p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setSelectedBot(null)}>
                  Close
                </Button>
              </div>

              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="config">Configuration</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <Card className="p-4 bg-secondary/20">
                    <h4 className="font-semibold mb-3">Current Status</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge variant={selectedBot.status === 'active' ? 'default' : 'secondary'}>
                          {selectedBot.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Created</p>
                        <p className="font-medium">{formatDuration(selectedBot.created_at)}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 bg-secondary/20">
                    <h4 className="font-semibold mb-3">Trading Statistics</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Trades</p>
                        <p className="text-xl font-bold">{selectedBot.total_trades || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Win Rate</p>
                        <p className="text-xl font-bold">{(selectedBot.win_rate || 0).toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Profit</p>
                        <p className={`text-xl font-bold ${
                          (selectedBot.total_profit || 0) >= 0 ? 'profit-text' : 'loss-text'
                        }`}>
                          {(selectedBot.total_profit || 0) >= 0 ? '+' : ''}${(selectedBot.total_profit || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="config" className="space-y-4">
                  <Card className="p-4 bg-secondary/20">
                    <h4 className="font-semibold mb-3">Bot Configuration</h4>
                    <pre className="text-xs bg-background p-3 rounded overflow-auto">
                      {JSON.stringify(selectedBot.config, null, 2)}
                    </pre>
                  </Card>
                </TabsContent>

                <TabsContent value="performance" className="space-y-4">
                  <Card className="p-4 bg-secondary/20 text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <h4 className="font-semibold mb-2">Performance Analytics</h4>
                    <p className="text-muted-foreground">
                      Detailed performance analytics will be available soon
                    </p>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BotManagement;