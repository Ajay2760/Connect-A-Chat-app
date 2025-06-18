import { MessageCircle, Users, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <MessageCircle className="text-primary-foreground" size={32} />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-4">Connect</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Experience real-time communication like never before. Chat instantly with friends, 
            share moments, and stay connected wherever you are.
          </p>
          <Button onClick={handleLogin} size="lg" className="text-lg px-8 py-3">
            Get Started
          </Button>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="text-primary" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-time Messaging</h3>
              <p className="text-muted-foreground">
                Send and receive messages instantly with lightning-fast delivery and read receipts.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="text-primary" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Stay Connected</h3>
              <p className="text-muted-foreground">
                See when your friends are online and track typing indicators for natural conversations.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="text-primary" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
              <p className="text-muted-foreground">
                Your conversations are protected with enterprise-grade security and privacy controls.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Demo Preview */}
        <div className="max-w-4xl mx-auto">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-muted/50 p-8 text-center">
                <div className="w-full h-64 bg-background/50 rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                  <div className="text-center">
                    <MessageCircle className="mx-auto mb-4 text-muted-foreground" size={48} />
                    <p className="text-muted-foreground">Beautiful chat interface preview</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Connect?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of users already chatting on Connect
          </p>
          <Button onClick={handleLogin} size="lg" variant="outline" className="text-lg px-8 py-3">
            Sign In Now
          </Button>
        </div>
      </div>
    </div>
  );
}
