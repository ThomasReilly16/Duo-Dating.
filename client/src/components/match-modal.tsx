import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Users } from "lucide-react";
import type { DuoProfile } from "@shared/schema";

interface MatchModalProps {
  isOpen: boolean;
  matchedProfile: DuoProfile;
  userProfile: DuoProfile;
  onClose: () => void;
  onSendMessage: () => void;
  onKeepSwiping: () => void;
}

export function MatchModal({ 
  isOpen, 
  matchedProfile, 
  userProfile, 
  onClose, 
  onSendMessage, 
  onKeepSwiping 
}: MatchModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="mx-6 max-w-sm w-full animate-scale-in">
        <CardContent className="p-8 text-center space-y-6">
          {/* Animated heart */}
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-coral to-like-red rounded-full flex items-center justify-center animate-wiggle">
            <Heart className="w-10 h-10 text-white" />
          </div>
          
          {/* Match text */}
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-slate">It's a Match!</h3>
            <p className="text-gray-600">
              You and {matchedProfile.coupleName} liked each other
            </p>
          </div>
          
          {/* Profile pictures */}
          <div className="flex items-center justify-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-coral/20 to-teal/20 rounded-2xl flex items-center justify-center">
              <Users className="w-8 h-8 text-coral" />
            </div>
            
            <div className="w-8 h-8 bg-gradient-to-r from-coral to-like-red rounded-full flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            
            <div className="w-16 h-16 bg-gradient-to-br from-teal/20 to-sky/20 rounded-2xl flex items-center justify-center">
              <Users className="w-8 h-8 text-teal" />
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="space-y-3">
            <Button
              onClick={onSendMessage}
              className="w-full bg-gradient-to-r from-coral to-like-red hover:from-coral/90 hover:to-like-red/90 text-white font-semibold py-4"
              size="lg"
            >
              Send Message
            </Button>
            
            <Button
              onClick={onKeepSwiping}
              variant="ghost"
              className="w-full text-gray-500 hover:text-gray-700"
            >
              Keep Swiping
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
