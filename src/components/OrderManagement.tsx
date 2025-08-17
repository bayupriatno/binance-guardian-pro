import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  ShoppingCart, 
  TrendingUp, 
  TrendingDown, 
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Filter,
  Zap
} from 'lucide-react';

interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop_loss' | 'take_profit';
  quantity: number;
  price?: number;
  stop_price?: number;
  status: 'pending' | 'filled' | 'cancelled' | 'rejected';
  filled_quantity: number;
  avg_fill_price?: number;
  created_at: string;
}

const OrderManagement = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewOrder, setShowNewOrder] = useState(false);
  
  // New order form state
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [type, setType] = useState<'market' | 'limit' | 'stop_loss' | 'take_profit'>('limit');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const tradingPairs = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'DOTUSDT', 
    'LINKUSDT', 'LTCUSDT', 'BCHUSDT', 'XLMUSDT', 'XRPUSDT'
  ];

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders((data || []) as Order[]);
    } catch (error: any) {
      toast({
        title: "Error loading orders",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const submitOrder = async () => {
    if (!quantity || (type !== 'market' && !price)) {
      toast({
        title: "Invalid order",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const orderData = {
        user_id: user.id,
        symbol,
        side,
        type,
        quantity: parseFloat(quantity),
        ...(type !== 'market' && { price: parseFloat(price) }),
        ...(type === 'stop_loss' && { stop_price: parseFloat(stopPrice) }),
      };

      const { error } = await supabase
        .from('orders')
        .insert(orderData);

      if (error) throw error;

      toast({
        title: "Order submitted",
        description: `${side.toUpperCase()} order for ${quantity} ${symbol} submitted successfully`,
      });

      // Reset form
      setQuantity('');
      setPrice('');
      setStopPrice('');
      setShowNewOrder(false);
      
      // Reload orders
      loadOrders();
    } catch (error: any) {
      toast({
        title: "Error submitting order",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Order cancelled",
        description: "Order has been cancelled successfully",
      });

      loadOrders();
    } catch (error: any) {
      toast({
        title: "Error cancelling order",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getOrderIcon = (status: string) => {
    switch (status) {
      case 'filled': return <CheckCircle className="w-4 h-4 text-profit" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-loss" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-destructive" />;
      default: return <Clock className="w-4 h-4 text-warning" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'filled': return 'default';
      case 'pending': return 'secondary';
      case 'cancelled': return 'outline';
      case 'rejected': return 'destructive';
      default: return 'secondary';
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
            <ShoppingCart className="w-5 h-5 mr-2 text-primary" />
            Order Management
          </h3>
          <Button 
            variant="premium" 
            onClick={() => setShowNewOrder(!showNewOrder)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Order
          </Button>
        </div>

        {showNewOrder && (
          <Card className="p-4 mb-6 bg-secondary/20 border-primary/20">
            <h4 className="font-semibold mb-4">Create New Order</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

              <div>
                <Label>Side</Label>
                <Select value={side} onValueChange={(value: 'buy' | 'sell') => setSide(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">Buy</SelectItem>
                    <SelectItem value="sell">Sell</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Type</Label>
                <Select value={type} onValueChange={(value: any) => setType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="market">Market</SelectItem>
                    <SelectItem value="limit">Limit</SelectItem>
                    <SelectItem value="stop_loss">Stop Loss</SelectItem>
                    <SelectItem value="take_profit">Take Profit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>

              {type !== 'market' && (
                <div>
                  <Label>Price</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
              )}

              {type === 'stop_loss' && (
                <div>
                  <Label>Stop Price</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={stopPrice}
                    onChange={(e) => setStopPrice(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-4">
              <Button 
                onClick={submitOrder}
                disabled={submitting}
                variant="premium"
                className="flex-1"
              >
                {submitting ? 'Submitting...' : 'Submit Order'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowNewOrder(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </Card>
        )}

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">Active Orders</TabsTrigger>
            <TabsTrigger value="filled">Order History</TabsTrigger>
            <TabsTrigger value="all">All Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-3">
            <div className="space-y-2">
              {orders.filter(order => order.status === 'pending').map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border"
                >
                  <div className="flex items-center gap-4">
                    {getOrderIcon(order.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{order.symbol}</span>
                        <Badge variant={order.side === 'buy' ? 'default' : 'destructive'}>
                          {order.side.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {order.type.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Qty: {order.quantity} {order.price && `@ $${order.price}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                    {order.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancelOrder(order.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {orders.filter(order => order.status === 'pending').length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No active orders
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="filled" className="space-y-3">
            <div className="space-y-2">
              {orders.filter(order => order.status === 'filled').map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/20 border border-border"
                >
                  <div className="flex items-center gap-4">
                    {getOrderIcon(order.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{order.symbol}</span>
                        <Badge variant={order.side === 'buy' ? 'default' : 'destructive'}>
                          {order.side.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {order.filled_quantity} @ ${order.avg_fill_price?.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <Badge variant={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
              {orders.filter(order => order.status === 'filled').length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No filled orders
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="all" className="space-y-3">
            <div className="space-y-2">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/20 border border-border"
                >
                  <div className="flex items-center gap-4">
                    {getOrderIcon(order.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{order.symbol}</span>
                        <Badge variant={order.side === 'buy' ? 'default' : 'destructive'}>
                          {order.side.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {order.type.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Qty: {order.quantity}
                        {order.price && ` @ $${order.price}`}
                        {order.avg_fill_price && ` (Filled: $${order.avg_fill_price.toFixed(2)})`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                    {order.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancelOrder(order.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default OrderManagement;