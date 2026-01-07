import React, { useEffect, useState } from 'react';
import { Instagram, Facebook, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSocialPosts, getSalonInfo } from '@/lib/api/store';
import { SocialPost, SalonInfo } from '@/types/store';

interface SocialFeedProps {
  title?: string;
  subtitle?: string;
  limit?: number;
}

export function SocialFeed({
  title = "Follow Us on Social",
  subtitle = "Stay updated with our latest work and special offers",
  limit = 6
}: SocialFeedProps) {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [salonInfo, setSalonInfo] = useState<SalonInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [postsData, infoData] = await Promise.all([
        getSocialPosts(limit),
        getSalonInfo()
      ]);
      setPosts(postsData);
      setSalonInfo(infoData);
      setLoading(false);
    };
    fetchData();
  }, [limit]);

  if (loading) {
    return (
      <section className="py-16 px-4 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container mx-auto text-center">
          <p className="text-muted-foreground">Loading social feed...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">{title}</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">{subtitle}</p>
          
          <div className="flex flex-wrap justify-center gap-4">
            {salonInfo?.socials?.instagram && (
              <Button
                variant="outline"
                size="lg"
                className="gap-2"
                onClick={() => window.open(salonInfo.socials!.instagram, '_blank')}
              >
                <Instagram className="w-5 h-5" />
                Follow on Instagram
              </Button>
            )}
            {salonInfo?.socials?.facebook && (
              <Button
                variant="outline"
                size="lg"
                className="gap-2"
                onClick={() => window.open(salonInfo.socials!.facebook, '_blank')}
              >
                <Facebook className="w-5 h-5" />
                Like us on Facebook
              </Button>
            )}
          </div>
        </div>

        {/* Social Posts Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {posts.map((post) => (
            <a
              key={post.id}
              href={post.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square overflow-hidden rounded-lg"
            >
              <img
                src={post.imageUrl}
                alt={post.caption}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                  {post.platform === 'instagram' ? (
                    <Instagram className="w-5 h-5" />
                  ) : (
                    <Facebook className="w-5 h-5" />
                  )}
                </div>
                <p className="text-sm text-center line-clamp-2 mb-2">{post.caption}</p>
                {post.likes && (
                  <div className="flex items-center gap-1 text-xs">
                    <Heart className="w-4 h-4 fill-current" />
                    <span>{post.likes}</span>
                  </div>
                )}
              </div>
            </a>
          ))}
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Tag us in your posts for a chance to be featured! 📸
          </p>
        </div>
      </div>
    </section>
  );
}
