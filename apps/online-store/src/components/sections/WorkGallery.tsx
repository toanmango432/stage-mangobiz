import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { getGallery } from '@/lib/api/store';
import { GalleryItem } from '@/types/store';

interface WorkGalleryProps {
  title?: string;
}

const categories = [
  { id: 'all', label: 'All Work' },
  { id: 'nails', label: 'Nails' },
  { id: 'hair', label: 'Hair' },
  { id: 'skincare', label: 'Skincare' },
  { id: 'makeup', label: 'Makeup' }
];

export function WorkGallery({ 
  title = "Our Work"
}: WorkGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [lightboxImage, setLightboxImage] = useState<GalleryItem | null>(null);
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      const data = await getGallery({ 
        limit: 50,
        tag: selectedCategory === 'all' ? undefined : selectedCategory
      });
      setImages(data.items);
      setLoading(false);
    };
    fetchImages();
  }, [selectedCategory]);

  const filteredImages = selectedCategory === 'all' 
    ? images 
    : images.filter(img => img.tags?.includes(selectedCategory.toLowerCase()));

  return (
    <>
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">{title}</h2>
          <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
            Browse through our portfolio and see the beautiful transformations we create
          </p>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category.id)}
                className="rounded-full"
              >
                {category.label}
              </Button>
            ))}
          </div>

          {/* Masonry Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <p className="text-muted-foreground">Loading gallery...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredImages.map((image) => (
                <div
                  key={image.id}
                  className="group relative cursor-pointer overflow-hidden rounded-lg aspect-square"
                  onClick={() => setLightboxImage(image)}
                >
                  <img
                    src={image.url}
                    alt={image.caption || 'Gallery image'}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    {image.caption && (
                      <p className="text-white font-medium">{image.caption}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredImages.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No images in this category yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox Modal */}
      <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          {lightboxImage && (
            <div className="relative">
              <button
                onClick={() => setLightboxImage(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                aria-label="Close lightbox"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={lightboxImage.url}
                alt={lightboxImage.caption || 'Gallery image'}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              {lightboxImage.caption && (
                <div className="p-4 bg-background border-t">
                  <p className="text-center font-medium">{lightboxImage.caption}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
