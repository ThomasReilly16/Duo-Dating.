import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send, MessageCircle, Heart, Users } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Match, DuoProfile, Message } from "@shared/schema";

type MatchWithProfile = Match & { profile: DuoProfile };

export default function MatchesPage() {
  const [, setLocation] = useLocation();
  const [selectedMatch, setSelectedMatch] = useState<MatchWithProfile | null>(null);
  const [messageText, setMessageText] = useState("");
  const { toast } = useToast();

  // Fetch user's matches
  const { data: matches = [], isLoading: matchesLoading } = useQuery<MatchWithProfile[]>({
    queryKey: ["/api/matches"],
  });

  // Fetch messages for selected match
  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/matches", selectedMatch?.id, "messages"],
    enabled: !!selectedMatch,
  });

  // Get user profile to identify own messages
  const { data: userProfile } = useQuery({
    queryKey: ["/api/duo-profiles/me"],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ matchId, content }: { matchId: number; content: string }) => {
      const res = await apiRequest("POST", `/api/matches/${matchId}/messages`, { content });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches", selectedMatch?.id, "messages"] });
      setMessageText("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch || !messageText.trim()) return;

    sendMessageMutation.mutate({
      matchId: selectedMatch.id,
      content: messageText.trim(),
    });
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(date));
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return formatTime(messageDate);
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return messageDate.toLocaleDateString();
    }
  };

  if (matchesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-coral/10 to-teal/10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-coral/10 to-teal/10 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => selectedMatch ? setSelectedMatch(null) : setLocation("/")}
          className="text-gray-600 hover:text-slate"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {selectedMatch ? "Back to Matches" : "Back"}
        </Button>
        
        <h2 className="text-xl font-semibold text-slate">
          {selectedMatch ? selectedMatch.profile.coupleName : "Your Matches"}
        </h2>
        
        <div className="w-16"></div>
      </div>

      <div className="flex-1 flex">
        {!selectedMatch ? (
          // Matches List View
          <div className="flex-1 max-w-2xl mx-auto">
            {matches.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center space-y-6 max-w-md">
                  <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-10 h-10 text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-slate">No matches yet</h3>
                    <p className="text-gray-600">Start browsing to connect with other couples!</p>
                  </div>
                  <Button
                    onClick={() => setLocation("/browse")}
                    className="bg-gradient-to-r from-coral to-teal hover:from-coral/90 hover:to-teal/90"
                  >
                    Start Browsing
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div className="text-center space-y-2 mb-6">
                  <h3 className="text-lg font-semibold text-slate">Your Connections</h3>
                  <p className="text-gray-600">
                    {matches.length} {matches.length === 1 ? "match" : "matches"}
                  </p>
                </div>

                {matches.map((match) => (
                  <Card
                    key={match.id}
                    className="border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedMatch(match)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-coral/20 to-teal/20 rounded-2xl flex items-center justify-center">
                          <Users className="w-8 h-8 text-coral" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-slate">{match.profile.coupleName}</h3>
                            <div className="w-3 h-3 bg-teal rounded-full"></div>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {match.profile.ages} • {match.profile.location}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Matched {formatDate(match.createdAt)}
                          </p>
                        </div>
                        
                        <div className="flex flex-col items-center space-y-1">
                          <div className="w-6 h-6 bg-coral rounded-full flex items-center justify-center">
                            <Heart className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Chat View
          <div className="flex-1 flex flex-col max-w-2xl mx-auto bg-white">
            {/* Match Profile Header */}
            <div className="border-b border-gray-100 p-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-coral/20 to-teal/20 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-coral" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate">{selectedMatch.profile.coupleName}</h3>
                  <p className="text-sm text-gray-500">{selectedMatch.profile.ages} • {selectedMatch.profile.location}</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-coral"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-coral to-teal rounded-full flex items-center justify-center animate-wiggle">
                    <Heart className="w-8 h-8 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-semibold text-slate">It's a Match!</h4>
                    <p className="text-gray-600">Start the conversation and plan your first double date!</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isOwn = message.fromDuoProfileId === userProfile?.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                            isOwn
                              ? "bg-gradient-to-r from-coral to-teal text-white"
                              : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${isOwn ? "text-white/70" : "text-gray-500"}`}>
                            {formatTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="border-t border-gray-100 p-4">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Send a message..."
                  className="flex-1"
                  disabled={sendMessageMutation.isPending}
                />
                <Button
                  type="submit"
                  disabled={!messageText.trim() || sendMessageMutation.isPending}
                  className="bg-gradient-to-r from-coral to-teal hover:from-coral/90 hover:to-teal/90"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation (only show when not in chat) */}
      {!selectedMatch && (
        <div className="bg-white border-t border-gray-100 px-6 py-4">
          <div className="flex items-center justify-around">
            <Button
              variant="ghost"
              className="flex flex-col items-center space-y-1"
              onClick={() => setLocation("/browse")}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                <Heart className="w-4 h-4 text-gray-400" />
              </div>
              <span className="text-xs text-gray-400">Discover</span>
            </Button>
            
            <Button
              variant="ghost"
              className="flex flex-col items-center space-y-1"
              onClick={() => setLocation("/matches")}
            >
              <div className="w-8 h-8 bg-teal/20 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-teal" />
              </div>
              <span className="text-xs text-teal font-medium">Matches</span>
            </Button>
            
            <Button
              variant="ghost"
              className="flex flex-col items-center space-y-1"
              onClick={() => setLocation("/create-profile")}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-gray-400" />
              </div>
              <span className="text-xs text-gray-400">Profile</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
