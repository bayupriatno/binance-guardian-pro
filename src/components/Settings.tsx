import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Settings as SettingsIcon, 
  Key, 
  Shield, 
  Bot, 
  TrendingUp,
  Save,
  X
} from 'lucide-react';

interface SettingsProps {
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    binance_api_key: '',
    binance_secret_key: '',
    auto_trading_enabled: false,
    auto_tp_sl_enabled: false,
    default_stop_loss_percent: 5.0,
    default_take_profit_percent: 10.0,
    max_daily_trades: 50,
    max_position_size: 1000.0
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          binance_api_key: data.binance_api_key || '',
          binance_secret_key: data.binance_secret_key || '',
          auto_trading_enabled: data.auto_trading_enabled || false,
          auto_tp_sl_enabled: data.auto_tp_sl_enabled || false,
          default_stop_loss_percent: data.default_stop_loss_percent || 5.0,
          default_take_profit_percent: data.default_take_profit_percent || 10.0,
          max_daily_trades: data.max_daily_trades || 50,
          max_position_size: data.max_position_size || 1000.0
        });
      }
    } catch (error: any) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const settingsData = {
        user_id: user.id,
        ...settings
      };

      const { error } = await supabase
        .from('user_settings')
        .upsert(settingsData, { onConflict: 'user_id' });

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Your settings have been saved successfully",
      });
      
      onClose();
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="trading-card w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <SettingsIcon className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Trading Settings</h2>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-8">
            {/* API Configuration */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Key className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-semibold">API Configuration</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="api-key">Binance API Key</Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="Enter your Binance API key"
                    value={settings.binance_api_key}
                    onChange={(e) => handleInputChange('binance_api_key', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="secret-key">Binance Secret Key</Label>
                  <Input
                    id="secret-key"
                    type="password"
                    placeholder="Enter your Binance secret key"
                    value={settings.binance_secret_key}
                    onChange={(e) => handleInputChange('binance_secret_key', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="p-4 bg-secondary/50 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground">
                  <Shield className="w-4 h-4 inline mr-2" />
                  Your API keys are encrypted and stored securely. Make sure to only use API keys with trading permissions.
                </p>
              </div>
            </div>

            <Separator />

            {/* Auto Trading Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Bot className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-semibold">Auto Trading</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                    <div>
                      <Label htmlFor="auto-trading">Enable Auto Trading</Label>
                      <p className="text-sm text-muted-foreground">Allow bots to execute trades automatically</p>
                    </div>
                    <Switch
                      id="auto-trading"
                      checked={settings.auto_trading_enabled}
                      onCheckedChange={(checked) => handleInputChange('auto_trading_enabled', checked)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="max-trades">Max Daily Trades</Label>
                    <Input
                      id="max-trades"
                      type="number"
                      value={settings.max_daily_trades}
                      onChange={(e) => handleInputChange('max_daily_trades', parseInt(e.target.value))}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                    <div>
                      <Label htmlFor="auto-tp-sl">Enable Auto TP/SL</Label>
                      <p className="text-sm text-muted-foreground">Automatic take profit and stop loss</p>
                    </div>
                    <Switch
                      id="auto-tp-sl"
                      checked={settings.auto_tp_sl_enabled}
                      onCheckedChange={(checked) => handleInputChange('auto_tp_sl_enabled', checked)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="max-position">Max Position Size ($)</Label>
                    <Input
                      id="max-position"
                      type="number"
                      step="0.01"
                      value={settings.max_position_size}
                      onChange={(e) => handleInputChange('max_position_size', parseFloat(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Risk Management */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-semibold">Risk Management</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stop-loss">Default Stop Loss (%)</Label>
                  <Input
                    id="stop-loss"
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="50"
                    value={settings.default_stop_loss_percent}
                    onChange={(e) => handleInputChange('default_stop_loss_percent', parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">Percentage loss to trigger stop loss</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="take-profit">Default Take Profit (%)</Label>
                  <Input
                    id="take-profit"
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="100"
                    value={settings.default_take_profit_percent}
                    onChange={(e) => handleInputChange('default_take_profit_percent', parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">Percentage gain to trigger take profit</p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={loading}
                className="premium-button"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Settings;