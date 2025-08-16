import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Bot, Shield, TrendingUp } from 'lucide-react';
import heroImage from '@/assets/hero-trading-dashboard.jpg';

const AuthPage = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const { toast } = useToast();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Welcome back to Binance Guardian Pro",
      });
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Please check your email to confirm your account",
      });
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

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Hero Image Section */}
      <div className="lg:w-1/2 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-background/50 lg:from-background/50 lg:to-transparent" />
        </div>
        
        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col justify-center h-full p-8 lg:p-12">
          <div className="max-w-lg">
            <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-6">
              Binance Guardian Pro
            </h1>
            <p className="text-xl text-foreground/90 mb-8">
              Enterprise-grade trading automation platform
            </p>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/20 backdrop-blur-sm">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Automated Trading</h3>
                  <p className="text-sm text-foreground/70">
                    Advanced algorithms for 24/7 market opportunities
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/20 backdrop-blur-sm">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Risk Management</h3>
                  <p className="text-sm text-foreground/70">
                    Built-in safety mechanisms and portfolio protection
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/20 backdrop-blur-sm">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Performance Analytics</h3>
                  <p className="text-sm text-foreground/70">
                    Real-time insights and comprehensive reporting
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Form Section */}
      <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-12 bg-background/95 backdrop-blur-sm">
        <div className="w-full max-w-md">
          <Card className="trading-card p-8">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                  />
                </div>

                <Button
                  type="submit"
                  variant="premium"
                  disabled={loading}
                  className="w-full"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Create a password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Confirm your password"
                  />
                </div>

                <Button
                  type="submit"
                  variant="premium"
                  disabled={loading}
                  className="w-full"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>
                By signing in, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;