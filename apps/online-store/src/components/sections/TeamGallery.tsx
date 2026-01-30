import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Instagram } from 'lucide-react';
import Link from 'next/link';
import { getTeam } from '@/lib/api/store';
import type { TeamMember } from '@/types/store';

interface TeamGalleryProps {
  title?: string;
}

export function TeamGallery({ 
  title = "Meet Our Team"
}: TeamGalleryProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getTeam();
        setMembers(data);
      } catch (error) {
        console.error('Failed to load team:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto text-center">
          <p className="text-muted-foreground">Loading team...</p>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">{title}</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Our talented team of professionals is dedicated to bringing out your natural beauty
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {members.map((member) => (
              <div
                key={member.id}
                className="group cursor-pointer"
                onClick={() => setSelectedMember(member)}
              >
                <div className="relative overflow-hidden rounded-lg mb-4 aspect-square">
                  <img
                    src={member.avatarUrl}
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                    <p className="text-white text-sm">Click to view bio</p>
                  </div>
                </div>
                
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                  <p className="text-muted-foreground text-sm mb-3">{member.role}</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {member.specialties?.slice(0, 2).map((specialty, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="max-w-2xl">
          {selectedMember && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedMember.name}</DialogTitle>
              </DialogHeader>
              
              <div className="grid md:grid-cols-2 gap-6">
                <img
                  src={selectedMember.avatarUrl}
                  alt={selectedMember.name}
                  className="rounded-lg w-full h-64 object-cover"
                />
                
                <div className="space-y-4">
                  <div>
                    <p className="text-primary font-medium mb-2">{selectedMember.role}</p>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {selectedMember.bio || selectedMember.bioShort}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Specialties</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedMember.specialties?.map((specialty, idx) => (
                        <Badge key={idx} variant="outline">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <Link href="/book">
                    <Button className="w-full">
                      Book with {selectedMember.name.split(' ')[0]}
                    </Button>
                  </Link>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
