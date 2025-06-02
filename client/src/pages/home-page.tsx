import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Users, Wine, ArrowRight, UserPlus, Search, MessageCircle } from "lucide-react";

export default function HomePage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Check if user has a duo profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ["/api/duo-profiles/me"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral"></div>
      </div>
    );
  }

  const hasProfile = !!profile;

  return (
    <div className="min-h-screen bg-gradient-to-br from-coral/10 to-teal/10">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-coral to-teal rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate">DuoConnect</h1>
              <p className="text-sm text-gray-500">Welcome, {user?.username}!</p>
            </div>
          </div>
          
          {hasProfile && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/browse")}
                className="border-coral text-coral hover:bg-coral hover:text-white"
              >
                <Search className="w-4 h-4 mr-2" />
                Browse
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/matches")}
                className="border-teal text-teal hover:bg-teal hover:text-white"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Matches
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {!hasProfile ? (
          // Welcome Flow - No Profile
          <div className="text-center space-y-12">
            {/* Hero Section */}
            <div className="space-y-6">
              <div className="relative">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-coral to-teal rounded-full flex items-center justify-center shadow-xl">
                  <Heart className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-8 w-8 h-8 bg-warm-orange rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl font-bold text-slate">Welcome to DuoConnect</h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Where couples meet couples for amazing experiences
                </p>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <Card className="border-gray-100 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-coral/20 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-coral" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-slate text-lg">Duo Profiles</h3>
                      <p className="text-gray-500">Create profiles as a couple</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-100 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-teal/20 rounded-xl flex items-center justify-center">
                      <Wine className="w-6 h-6 text-teal" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-slate text-lg">Group Activities</h3>
                      <p className="text-gray-500">Find couples for double dates</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-4 max-w-md mx-auto">
              <Button
                onClick={() => setLocation("/create-profile")}
                className="w-full bg-gradient-to-r from-coral to-teal hover:from-coral/90 hover:to-teal/90 text-white font-semibold py-4 text-lg shadow-lg"
                size="lg"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Create Duo Profile
              </Button>
              
              <p className="text-sm text-gray-500">
                Get started by creating your couple's profile
              </p>
            </div>
          </div>
        ) : (
          // Dashboard - Has Profile
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold text-slate">Your DuoConnect Dashboard</h1>
              <p className="text-gray-600">Ready to meet other amazing couples?</p>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-gray-100 shadow-lg hover:shadow-xl transition-all cursor-pointer group" onClick={() => setLocation("/browse")}>
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-coral/20 rounded-2xl flex items-center justify-center group-hover:bg-coral group-hover:text-white transition-colors">
                    <Search className="w-8 h-8 text-coral group-hover:text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate text-lg">Discover Couples</h3>
                    <p className="text-gray-500 text-sm">Browse and connect with other duos</p>
                  </div>
                  <Button variant="ghost" className="group-hover:text-coral">
                    Start Browsing <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-gray-100 shadow-lg hover:shadow-xl transition-all cursor-pointer group" onClick={() => setLocation("/matches")}>
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-teal/20 rounded-2xl flex items-center justify-center group-hover:bg-teal group-hover:text-white transition-colors">
                    <MessageCircle className="w-8 h-8 text-teal group-hover:text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate text-lg">Your Matches</h3>
                    <p className="text-gray-500 text-sm">Chat with couples you've connected with</p>
                  </div>
                  <Button variant="ghost" className="group-hover:text-teal">
                    View Matches <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-gray-100 shadow-lg hover:shadow-xl transition-all cursor-pointer group" onClick={() => setLocation("/create-profile")}>
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-sky/20 rounded-2xl flex items-center justify-center group-hover:bg-sky group-hover:text-white transition-colors">
                    <Users className="w-8 h-8 text-sky group-hover:text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate text-lg">Edit Profile</h3>
                    <p className="text-gray-500 text-sm">Update your couple's information</p>
                  </div>
                  <Button variant="ghost" className="group-hover:text-sky">
                    Edit Profile <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Profile Summary */}
            <Card className="border-gray-100 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-slate text-lg">Profile: {profile.coupleName}</h3>
                    <p className="text-gray-600">{profile.ages} • {profile.location}</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.interests?.map((interest: string, index: number) => (
                        <span key={index} className="px-3 py-1 bg-coral/20 text-coral rounded-full text-sm">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setLocation("/create-profile")}
                    className="border-gray-200 hover:border-coral hover:text-coral"
                  >
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
