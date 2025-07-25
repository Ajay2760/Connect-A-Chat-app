import { MessageCircle, Users, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

export default function Landing() {
  const [name, setName] = useState("");
  const { setGuestUser } = useAuth();

  const handleJoinChat = () => {
    if (name.trim()) {
      setGuestUser(name.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoinChat();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
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
          <div className="max-w-md mx-auto space-y-4">
            <Input
              type="text"
              placeholder="Enter your name to start chatting"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={handleKeyPress}
              className="text-center text-lg py-3"
            />
            <Button 
              onClick={handleJoinChat} 
              size="lg" 
              className="w-full text-lg py-3"
              disabled={!name.trim()}
            >
              Start Chatting
            </Button>
          </div>
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



        {/* Call to Action */}
        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Connect?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of users already chatting on Connect
          </p>
          <div className="max-w-md mx-auto space-y-4">
            <Input
              type="text"
              placeholder="Enter your name to start chatting"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={handleKeyPress}
              className="text-center text-lg py-3"
            />
            <Button 
              onClick={handleJoinChat} 
              size="lg" 
              className="w-full text-lg py-3"
              disabled={!name.trim()}
            >
              Start Chatting
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
