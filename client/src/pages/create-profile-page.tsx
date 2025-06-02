import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Camera, Plus, Check } from "lucide-react";
import { insertDuoProfileSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PhotoUpload } from "@/components/photo-upload";

const availableInterests = [
  "🍷 Wine Tasting",
  "🏃‍♂️ Fitness", 
  "🎮 Gaming",
  "🍳 Cooking",
  "🏕️ Outdoors",
  "🎬 Movies",
  "🎵 Music",
  "📸 Photography",
  "✈️ Travel",
  "🎨 Art",
  "📚 Reading",
  "🏖️ Beach",
];

const profileSchema = insertDuoProfileSchema.extend({
  bio: z.string().min(10, "Bio must be at least 10 characters").max(500, "Bio must be less than 500 characters"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function CreateProfilePage() {
  const [, setLocation] = useLocation();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const { toast } = useToast();

  // Fetch existing profile if it exists
  const { data: existingProfile, isLoading } = useQuery({
    queryKey: ["/api/duo-profiles/me"],
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      coupleName: "",
      ages: "",
      location: "",
      bio: "",
      interests: [],
      photos: [],
      isActive: true,
    },
  });

  // Set form values when existing profile loads
  useEffect(() => {
    if (existingProfile && existingProfile.coupleName) {
      form.reset({
        coupleName: existingProfile.coupleName || "",
        ages: existingProfile.ages || "",
        location: existingProfile.location || "",
        bio: existingProfile.bio || "",
        interests: existingProfile.interests || [],
        photos: existingProfile.photos || [],
        isActive: existingProfile.isActive ?? true,
      });
      setSelectedInterests(existingProfile.interests || []);
      setPhotos(existingProfile.photos || []);
    }
  }, [existingProfile, form]);

  const createMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const res = await apiRequest("POST", "/api/duo-profiles", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/duo-profiles/me"] });
      toast({
        title: "Profile created!",
        description: "Your duo profile has been created successfully.",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const res = await apiRequest("PUT", "/api/duo-profiles/me", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/duo-profiles/me"] });
      toast({
        title: "Profile updated!",
        description: "Your duo profile has been updated successfully.",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleInterest = (interest: string) => {
    const updated = selectedInterests.includes(interest)
      ? selectedInterests.filter(i => i !== interest)
      : [...selectedInterests, interest];
    
    setSelectedInterests(updated);
    form.setValue("interests", updated);
  };

  const onSubmit = (data: ProfileFormData) => {
    const profileData = {
      ...data,
      interests: selectedInterests,
      photos: photos,
    };

    if (existingProfile) {
      updateMutation.mutate(profileData);
    } else {
      createMutation.mutate(profileData);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral"></div>
      </div>
    );
  }

  const isEditing = !!existingProfile;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-coral/10 to-teal/10">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/")}
          className="text-gray-600 hover:text-slate"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h2 className="font-semibold text-slate">
          {isEditing ? "Edit Duo Profile" : "Create Duo Profile"}
        </h2>
        <div className="w-16"></div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Progress indicator */}
            <div className="flex items-center space-x-2">
              <div className="flex-1 h-2 bg-coral rounded-full"></div>
              <div className="flex-1 h-2 bg-coral rounded-full"></div>
              <div className="flex-1 h-2 bg-coral rounded-full"></div>
            </div>

            {/* Photo Upload Section */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xl font-semibold text-slate">Add Your Photos</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="aspect-square bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center space-y-2">
                    <Camera className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-500 text-center">Main Photo</span>
                    <span className="text-xs text-gray-400 text-center">Upload functionality coming soon</span>
                  </div>
                  <div className="aspect-square bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center space-y-2">
                    <Plus className="w-6 h-6 text-gray-400" />
                    <span className="text-xs text-gray-500 text-center">Add More</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Basic Information */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xl font-semibold text-slate">Basic Information</h3>
                
                <FormField
                  control={form.control}
                  name="coupleName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Couple Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Sarah & Mike" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="ages"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ages</FormLabel>
                        <FormControl>
                          <Input placeholder="25 & 27" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="San Francisco" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>About Us</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell other couples about yourselves, what you enjoy doing together, and what kind of experiences you're looking for..."
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Photo Upload Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate">Photos</h3>
                  <p className="text-sm text-gray-600">Add photos of you both together (up to 6 photos)</p>
                  <PhotoUpload 
                    photos={photos} 
                    onPhotosChange={setPhotos}
                    maxPhotos={6}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Interests */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xl font-semibold text-slate">Shared Interests</h3>
                <p className="text-sm text-gray-600">Select activities you both enjoy</p>
                
                <div className="grid grid-cols-2 gap-3">
                  {availableInterests.map((interest) => (
                    <Badge
                      key={interest}
                      variant={selectedInterests.includes(interest) ? "default" : "outline"}
                      className={`px-4 py-2 cursor-pointer transition-all justify-center ${
                        selectedInterests.includes(interest)
                          ? "bg-coral text-white border-coral hover:bg-coral/90"
                          : "border-gray-200 text-gray-600 hover:border-coral hover:text-coral"
                      }`}
                      onClick={() => toggleInterest(interest)}
                    >
                      {selectedInterests.includes(interest) && (
                        <Check className="w-3 h-3 mr-1" />
                      )}
                      {interest}
                    </Badge>
                  ))}
                </div>
                
                {selectedInterests.length === 0 && (
                  <p className="text-sm text-gray-500">Please select at least one interest</p>
                )}
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-coral to-teal hover:from-coral/90 hover:to-teal/90 text-white font-semibold py-4 text-lg"
              disabled={isSubmitting || selectedInterests.length === 0}
              size="lg"
            >
              {isSubmitting 
                ? (isEditing ? "Updating Profile..." : "Creating Profile...")
                : (isEditing ? "Update Profile" : "Create Profile")
              }
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
