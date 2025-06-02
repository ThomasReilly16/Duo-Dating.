import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, X, MapPin, Users, ChevronLeft, ChevronRight } from "lucide-react";
import type { DuoProfile } from "@shared/schema";

interface DuoProfileCardProps {
  profile: DuoProfile;
  isTop?: boolean;
  onLike: () => void;
  onPass: () => void;
  isSwipeInProgress?: boolean;
}

export function DuoProfileCard({ 
  profile, 
  isTop = true, 
  onLike, 
  onPass, 
  isSwipeInProgress = false 
}: DuoProfileCardProps) {
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  const hasPhotos = profile.photos && profile.photos.length > 0;
  const totalPhotos = hasPhotos ? profile.photos.length : 0;
  
  const nextPhoto = () => {
    if (hasPhotos && currentPhotoIndex < totalPhotos - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };
  
  const prevPhoto = () => {
    if (hasPhotos && currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  const handleLike = () => {
    if (isSwipeInProgress) return;
    setSwipeDirection('right');
    setTimeout(onLike, 150);
  };

  const handlePass = () => {
    if (isSwipeInProgress) return;
    setSwipeDirection('left');
    setTimeout(onPass, 150);
  };

  return (
    <div className={`
      bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ease-out
      ${isTop ? 'relative' : 'absolute inset-0'} 
      ${swipeDirection === 'right' ? 'card-swipe swipe-right' : ''}
      ${swipeDirection === 'left' ? 'card-swipe swipe-left' : ''}
    `}>
      {/* Profile Photos */}
      <div className="relative h-80 bg-gradient-to-br from-coral/20 to-teal/20 overflow-hidden">
        {hasPhotos ? (
          <>
            <img 
              src={profile.photos[currentPhotoIndex]} 
              alt={`${profile.coupleName} - Photo ${currentPhotoIndex + 1}`}
              className="w-full h-full object-cover"
            />
            
            {/* Photo Navigation */}
            {totalPhotos > 1 && (
              <>
                <button 
                  onClick={prevPhoto}
                  className={`absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 transition-opacity ${
                    currentPhotoIndex === 0 ? 'opacity-50' : 'hover:bg-black/70'
                  }`}
                  disabled={currentPhotoIndex === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={nextPhoto}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 transition-opacity ${
                    currentPhotoIndex === totalPhotos - 1 ? 'opacity-50' : 'hover:bg-black/70'
                  }`}
                  disabled={currentPhotoIndex === totalPhotos - 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                
                {/* Photo Indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                  {profile.photos.map((_, index) => (
                    <div 
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
            
            {/* Name Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
              <h3 className="text-2xl font-bold text-white">{profile.coupleName}</h3>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-center space-y-4">
            <div className="space-y-4">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-coral to-teal rounded-full flex items-center justify-center">
                <Users className="w-12 h-12 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate">{profile.coupleName}</h3>
                <p className="text-lg text-gray-600">{profile.ages}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
      </div>
      
      {/* Profile Info */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <div className="space-y-3">
          <div>
            <h3 className="text-2xl font-bold">{profile.coupleName}</h3>
            <p className="text-lg opacity-90">{profile.ages}</p>
            <p className="text-sm opacity-75 flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              {profile.location}
            </p>
          </div>
          
          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.interests.slice(0, 3).map((interest, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30"
                >
                  {interest}
                </Badge>
              ))}
              {profile.interests.length > 3 && (
                <Badge
                  variant="secondary"
                  className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white border-white/30"
                >
                  +{profile.interests.length - 3} more
                </Badge>
              )}
            </div>
          )}
          
          {/* Bio */}
          {profile.bio && (
            <p className="text-sm opacity-90 line-clamp-3">
              {profile.bio}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons - Only show on top card */}
      {isTop && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-4">
          <Button
            onClick={handlePass}
            disabled={isSwipeInProgress}
            size="lg"
            variant="outline"
            className="w-14 h-14 rounded-full bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-lg"
          >
            <X className="w-6 h-6 text-gray-500" />
          </Button>
          
          <Button
            onClick={handleLike}
            disabled={isSwipeInProgress}
            size="lg"
            className="w-14 h-14 rounded-full bg-gradient-to-br from-coral to-like-red hover:from-coral/90 hover:to-like-red/90 shadow-lg"
          >
            <Heart className="w-6 h-6 text-white" />
          </Button>
        </div>
      )}
    </div>
  );
}
