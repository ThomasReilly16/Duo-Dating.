import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, X, Camera, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface PhotoUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
}

export function PhotoUpload({ photos, onPhotosChange, maxPhotos = 6 }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadPhoto = async (file: File) => {
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const response = await fetch('/api/upload-photo', {
        method: 'POST',
        body: formData,
        credentials: 'include', // Include session cookies
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      return data.photoUrl;
    } catch (error) {
      throw new Error('Failed to upload photo');
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = maxPhotos - photos.length;
    if (files.length > remainingSlots) {
      toast({
        title: "Too many photos",
        description: `You can only upload ${remainingSlots} more photo${remainingSlots === 1 ? '' : 's'}`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const uploadPromises = files.map(uploadPhoto);
      const newPhotoUrls = await Promise.all(uploadPromises);
      onPhotosChange([...photos, ...newPhotoUrls]);
      
      toast({
        title: "Photos uploaded!",
        description: `Successfully uploaded ${files.length} photo${files.length === 1 ? '' : 's'}`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload photos. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removePhoto = (indexToRemove: number) => {
    const updatedPhotos = photos.filter((_, index) => index !== indexToRemove);
    onPhotosChange(updatedPhotos);
  };

  const canAddMore = photos.length < maxPhotos;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map((photo, index) => (
          <Card key={index} className="relative aspect-square overflow-hidden group">
            <img
              src={photo}
              alt={`Couple photo ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => removePhoto(index)}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          </Card>
        ))}
        
        {canAddMore && (
          <Card 
            className="aspect-square border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-coral-500 dark:hover:border-coral-400 transition-colors cursor-pointer flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 hover:text-coral-500 dark:hover:text-coral-400"
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <div className="animate-spin h-8 w-8 border-2 border-coral-500 border-t-transparent rounded-full" />
            ) : (
              <>
                <Camera className="h-8 w-8 mb-2" />
                <span className="text-sm text-center px-2">
                  Add Photo
                </span>
              </>
            )}
          </Card>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {canAddMore && (
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? 'Uploading...' : 'Upload Photos'}
        </Button>
      )}

      <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
        {photos.length} of {maxPhotos} photos • Add photos of you both together
      </p>
    </div>
  );
}