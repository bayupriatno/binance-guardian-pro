import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Bell, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Volume2,
  Bot,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';

interface Alert {
  id: string;
  type: 'price' | 'volume' | 'bot_status' | 'pnl';
  symbol?: string;
  condition_type: 'above' | 'below' | 'equals' | 'percentage_change';
  target_value: number;
  current_value?: number;
  triggered: boolean;
  enabled: boolean;
  title: string;
  message?: string;
  created_at: string;
}

const AlertsManager = () => {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewAlert, setShowNewAlert] = useState(false);
  
  // New alert form state
  const [type, setType] = useState<'price' | 'volume' | 'bot_status' | 'pnl'>('price');
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [conditionType, setConditionType] = useState<'above' | 'below' | 'equals' | 'percentage_change'>('above');
  const [targetValue, setTargetValue] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const tradingPairs = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'DOTUSDT', 
    'LINKUSDT', 'LTCUSDT', 'BCHUSDT', 'XLMUSDT', 'XRPUSDT'
  ];

  const alertTypes = [
    { value: 'price', label: 'Price Alert', icon: DollarSign, description: 'Get notified when price reaches target' },
    { value: 'volume', label: 'Volume Alert', icon: Volume2, description: 'Alert on volume spikes' },
    { value: 'bot_status', label: 'Bot Status', icon: Bot, description: 'Monitor bot performance' },
    { value: 'pnl', label: 'P&L Alert', icon: TrendingUp, description: 'Track profit/loss thresholds' },
  ];

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts((data || []) as Alert[]);
    } catch (error: any) {
      toast({
        title: "Error loading alerts",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createAlert = async () => {
    if (!title || !targetValue) {
      toast({
        title: "Invalid alert",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const alertData = {
        user_id: user.id,
        type,
        symbol: type === 'price' || type === 'volume' ? symbol : null,
        condition_type: conditionType,
        target_value: parseFloat(targetValue),
        title,
        message: message || null,
        enabled: true,
      };

      const { error } = await supabase
        .from('alerts')
        .insert(alertData);

      if (error) throw error;

      toast({
        title: "Alert created",
        description: "Your alert has been created successfully",
      });

      // Reset form
      setTitle('');
      setMessage('');
      setTargetValue('');
      setShowNewAlert(false);
      
      // Reload alerts
      loadAlerts();
    } catch (error: any) {
      toast({
        title: "Error creating alert",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAlert = async (alertId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ enabled })
        .eq('id', alertId);

      if (error) throw error;

      loadAlerts();
      
      toast({
        title: enabled ? "Alert enabled" : "Alert disabled",
        description: `Alert has been ${enabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error: any) {
      toast({
        title: "Error updating alert",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('id', alertId);

      if (error) throw error;

      loadAlerts();
      
      toast({
        title: "Alert deleted",
        description: "Alert has been deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting alert",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getAlertIcon = (alertType: string) => {
    const iconType = alertTypes.find(t => t.value === alertType);
    if (!iconType) return Bell;
    return iconType.icon;
  };

  const getConditionText = (condition: string, value: number, symbol?: string) => {
    const symbolText = symbol ? ` for ${symbol}` : '';
    switch (condition) {
      case 'above':
        return `above $${value}${symbolText}`;
      case 'below':
        return `below $${value}${symbolText}`;
      case 'equals':
        return `equals $${value}${symbolText}`;
      case 'percentage_change':
        return `${value}% change${symbolText}`;
      default:
        return `$${value}${symbolText}`;
    }
  };

  if (loading) {
    return (
      <Card className="trading-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-secondary rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-secondary/50 rounded"></div>
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
            <Bell className="w-5 h-5 mr-2 text-primary" />
            Alert Management
          </h3>
          <Button 
            variant="premium" 
            onClick={() => setShowNewAlert(!showNewAlert)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Alert
          </Button>
        </div>

        {showNewAlert && (
          <Card className="p-4 mb-6 bg-secondary/20 border-primary/20">
            <h4 className="font-semibold mb-4">Create New Alert</h4>
            
            {/* Alert Type Selection */}
            <div className="mb-4">
              <Label className="mb-2 block">Alert Type</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {alertTypes.map((alertType) => (
                  <div
                    key={alertType.value}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      type === alertType.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setType(alertType.value as any)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <alertType.icon className="w-4 h-4 text-primary" />
                      <span className="font-medium text-sm">{alertType.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{alertType.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label>Alert Title</Label>
                <Input
                  placeholder="Bitcoin Alert"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {(type === 'price' || type === 'volume') && (
                <div>
                  <Label>Symbol</Label>
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
              )}

              <div>
                <Label>Condition</Label>
                <Select value={conditionType} onValueChange={(value: any) => setConditionType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="above">Above</SelectItem>
                    <SelectItem value="below">Below</SelectItem>
                    <SelectItem value="equals">Equals</SelectItem>
                    {type === 'pnl' && (
                      <SelectItem value="percentage_change">% Change</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>
                  Target Value 
                  {type === 'pnl' && conditionType === 'percentage_change' ? ' (%)' : ' ($)'}
                </Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4">
              <Label>Message (Optional)</Label>
              <Textarea
                placeholder="Custom alert message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex gap-3 mt-4">
              <Button 
                onClick={createAlert}
                disabled={submitting}
                variant="premium"
                className="flex-1"
              >
                {submitting ? 'Creating...' : 'Create Alert'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowNewAlert(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {/* Alerts List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Your Alerts</h4>
            <Badge variant="secondary">
              {alerts.filter(a => a.enabled).length} active
            </Badge>
          </div>

          {alerts.map((alert) => {
            const AlertIcon = getAlertIcon(alert.type);
            return (
              <div
                key={alert.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                  alert.triggered 
                    ? 'bg-warning/10 border-warning/30' 
                    : alert.enabled 
                      ? 'bg-secondary/20 border-border' 
                      : 'bg-secondary/10 border-border opacity-60'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    alert.triggered ? 'bg-warning/20' : 'bg-primary/10'
                  }`}>
                    <AlertIcon className={`w-4 h-4 ${
                      alert.triggered ? 'text-warning' : 'text-primary'
                    }`} />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{alert.title}</span>
                      {alert.triggered && (
                        <Badge variant="secondary" className="bg-warning/20 text-warning">
                          Triggered
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {alert.type.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Notify when {getConditionText(alert.condition_type, alert.target_value, alert.symbol)}
                    </div>
                    {alert.message && (
                      <div className="text-xs text-muted-foreground mt-1">
                        "{alert.message}"
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={alert.enabled}
                    onCheckedChange={(enabled) => toggleAlert(alert.id, enabled)}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteAlert(alert.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}

          {alerts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No alerts created yet</p>
              <p className="text-sm">Create your first alert to get notified about market changes</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AlertsManager;