import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, X } from 'lucide-react';
import { Service } from '@/types/catalog';

interface ServicePickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectService: (service: Service) => void;
  currentService?: Service;
}

export const ServicePickerModal = ({ 
  open, 
  onOpenChange, 
  onSelectService,
  currentService 
}: ServicePickerModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    // Load services from localStorage or use mock data
    const stored = localStorage.getItem('catalog_services');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Map to Service format
      setServices(parsed.map((s: any) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        duration: s.duration,
        price: s.basePrice || s.price || 0,
        category: s.category,
      })));
    } else {
      const mockServices = generateMockServices();
      setServices(mockServices.map((s: any) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        duration: s.duration,
        price: s.basePrice || s.price || 0,
        category: s.category,
      })));
    }
  }, []);

  const categories = ['all', ...new Set(services.map(s => s.category).filter(Boolean))];

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Select Service</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === 'all' ? 'All Services' : cat}
              </Button>
            ))}
          </div>

          {/* Services List */}
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {filteredServices.map(service => (
                <div
                  key={service.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-primary ${
                    currentService?.id === service.id ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => {
                    onSelectService({
                      id: service.id,
                      name: service.name,
                      description: service.description,
                      duration: service.duration,
                      price: service.price,
                    });
                    onOpenChange(false);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{service.name}</h4>
                        {currentService?.id === service.id && (
                          <Badge variant="secondary" className="text-xs">Selected</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">{service.duration} min</span>
                        <span className="font-semibold">${service.price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {filteredServices.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No services found matching your search.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
