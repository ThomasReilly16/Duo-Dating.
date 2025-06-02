import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, X, MessageCircle, Search } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DuoProfileCard } from "@/components/duo-profile-card";
import { MatchModal } from "@/components/match-modal";
import type { DuoProfile } from "@shared/schema";

export default function BrowsePage() {
  const [, setLocation] = useLocation();
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [matchedProfile, setMatchedProfile] = useState<DuoProfile | null>(null);
  const [isSwipeInProgress, setIsSwipeInProgress] = useState(false);
  const { toast } = useToast();

  // Fetch profiles to browse
  const { data: profiles = [], isLoading, refetch } = useQuery<DuoProfile[]>({
    queryKey: ["/api/duo-profiles/browse"],
  });

  // Check if user has a profile
  const { data: userProfile } = useQuery({
    queryKey: ["/api/duo-profiles/me"],
  });

  const likeMutation = useMutation({
    mutationFn: async (toDuoProfileId: number) => {
      const res = await apiRequest("POST", "/api/likes", { toDuoProfileId });
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.match) {
        // Show match modal
        const likedProfile = profiles[currentProfileIndex];
        setMatchedProfile(likedProfile);
      } else {
        toast({
          title: "Profile liked!",
          description: "Keep browsing to find more connections.",
        });
      }
      
      // Move to next profile
      setTimeout(() => {
        setCurrentProfileIndex(prev => prev + 1);
        setIsSwipeInProgress(false);
      }, 300);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsSwipeInProgress(false);
    },
  });

  // Redirect to create profile if user doesn't have one
  useEffect(() => {
    if (userProfile === null) {
      setLocation("/create-profile");
    }
  }, [userProfile, setLocation]);

  const handleLike = () => {
    if (isSwipeInProgress || !profiles[currentProfileIndex]) return;
    
    setIsSwipeInProgress(true);
    likeMutation.mutate(profiles[currentProfileIndex].id);
  };

  const handlePass = () => {
    if (isSwipeInProgress || !profiles[currentProfileIndex]) return;
    
    setIsSwipeInProgress(true);
    
    // Just move to next profile with animation
    setTimeout(() => {
      setCurrentProfileIndex(prev => prev + 1);
      setIsSwipeInProgress(false);
    }, 300);
  };

  const handleMatchModalClose = () => {
    setMatchedProfile(null);
  };

  const handleSendMessage = () => {
    setMatchedProfile(null);
    setLocation("/matches");
  };

  const handleKeepSwiping = () => {
    setMatchedProfile(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-coral/10 to-teal/10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral"></div>
      </div>
    );
  }

  if (!userProfile) {
    return null; // Will redirect to create profile
  }

  const currentProfile = profiles[currentProfileIndex];
  const hasMoreProfiles = currentProfileIndex < profiles.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-coral/10 to-teal/10">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="text-gray-600 hover:text-slate"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-coral to-teal rounded-full flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate">DuoConnect</h1>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/matches")}
            className="text-gray-600 hover:text-slate relative"
          >
            <MessageCircle className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Card Stack Container */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="relative w-full max-w-sm mx-auto">
          {!hasMoreProfiles ? (
            // No more profiles
            <div className="bg-white rounded-3xl shadow-xl p-8 text-center space-y-6">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-slate">No more profiles</h3>
                <p className="text-gray-600">Check back later for new couples to connect with!</p>
              </div>
              <div className="space-y-3">
                <Button
                  onClick={() => refetch()}
                  className="w-full bg-gradient-to-r from-coral to-teal hover:from-coral/90 hover:to-teal/90"
                >
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setLocation("/matches")}
                  className="w-full border-gray-200 hover:border-coral hover:text-coral"
                >
                  View Matches
                </Button>
              </div>
            </div>
          ) : (
            // Profile cards stack
            <>
              {/* Show up to 3 cards in stack */}
              {profiles.slice(currentProfileIndex, currentProfileIndex + 3).map((profile, index) => (
                <div
                  key={profile.id}
                  className="absolute inset-0"
                  style={{
                    zIndex: 3 - index,
                    transform: `scale(${1 - (index * 0.05)})`,
                  }}
                >
                  <DuoProfileCard
                    profile={profile}
                    isTop={index === 0}
                    onLike={handleLike}
                    onPass={handlePass}
                    isSwipeInProgress={isSwipeInProgress}
                  />
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Bottom Action Buttons */}
      {hasMoreProfiles && currentProfile && (
        <div className="bg-white border-t border-gray-100 px-6 py-4">
          <div className="flex items-center justify-center space-x-8">
            <Button
              onClick={handlePass}
              disabled={isSwipeInProgress}
              size="lg"
              variant="outline"
              className="w-16 h-16 rounded-full border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            >
              <X className="w-6 h-6 text-gray-500" />
            </Button>
            
            <Button
              onClick={handleLike}
              disabled={isSwipeInProgress}
              size="lg"
              className="w-16 h-16 rounded-full bg-gradient-to-br from-coral to-like-red hover:from-coral/90 hover:to-like-red/90 shadow-lg"
            >
              <Heart className="w-6 h-6 text-white" />
            </Button>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="bg-white border-t border-gray-100 px-6 py-4">
        <div className="flex items-center justify-around">
          <Button
            variant="ghost"
            className="flex flex-col items-center space-y-1"
            onClick={() => setLocation("/browse")}
          >
            <div className="w-8 h-8 bg-coral/20 rounded-lg flex items-center justify-center">
              <Search className="w-4 h-4 text-coral" />
            </div>
            <span className="text-xs text-coral font-medium">Discover</span>
          </Button>
          
          <Button
            variant="ghost"
            className="flex flex-col items-center space-y-1"
            onClick={() => setLocation("/matches")}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-gray-400" />
            </div>
            <span className="text-xs text-gray-400">Matches</span>
          </Button>
          
          <Button
            variant="ghost"
            className="flex flex-col items-center space-y-1"
            onClick={() => setLocation("/create-profile")}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
              <Heart className="w-4 h-4 text-gray-400" />
            </div>
            <span className="text-xs text-gray-400">Profile</span>
          </Button>
        </div>
      </div>

      {/* Match Modal */}
      {matchedProfile && (
        <MatchModal
          isOpen={!!matchedProfile}
          matchedProfile={matchedProfile}
          userProfile={userProfile}
          onClose={handleMatchModalClose}
          onSendMessage={handleSendMessage}
          onKeepSwiping={handleKeepSwiping}
        />
      )}
    </div>
  );
}
