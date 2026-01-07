import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ShoppingCart, 
  Edit2, 
  Trash2, 
  Clock, 
  GripVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CartItem, Service } from './types';
import { StickyActionBar } from './StickyActionBar';

interface SmartCartProps {
  items: CartItem[];
  onEdit: (itemId: string) => void;
  onRemove: (itemId: string) => void;
  onUpdateAssignment: (itemId: string, assignedTo: string) => void;
  onAddPerson: () => void;
  onContinue: () => void;
  onBack: () => void;
  isGroupBooking?: boolean;
}

export const SmartCart: React.FC<SmartCartProps> = ({
  items,
  onEdit,
  onRemove,
  onUpdateAssignment,
  onAddPerson,
  onContinue,
  onBack,
  isGroupBooking = false,
}) => {
  const [editingPerson, setEditingPerson] = useState<string | null>(null);
  const [newPersonName, setNewPersonName] = useState('');

  // Get unique people from cart items
  const people = Array.from(new Set(items.map(item => item.assignedTo)));
  const totalPrice = items.reduce((sum, item) => sum + item.service.price, 0);
  const totalDuration = items.reduce((sum, item) => sum + item.service.duration, 0);

  const handlePersonEdit = (currentName: string) => {
    setEditingPerson(currentName);
    setNewPersonName(currentName);
  };

  const handlePersonSave = () => {
    if (editingPerson && newPersonName.trim()) {
      // Update all items assigned to the old name
      items
        .filter(item => item.assignedTo === editingPerson)
        .forEach(item => onUpdateAssignment(item.id, newPersonName.trim()));
    }
    setEditingPerson(null);
    setNewPersonName('');
  };

  const handlePersonCancel = () => {
    setEditingPerson(null);
    setNewPersonName('');
  };

  const getAvailablePeople = () => {
    const existingPeople = Array.from(new Set(items.map(item => item.assignedTo)));
    return [
      ...existingPeople,
      ...Array.from({ length: 5 }, (_, i) => `Guest ${i + 1}`).filter(
        name => !existingPeople.includes(name)
      )
    ];
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">Add some services to get started</p>
          <Button onClick={onBack} variant="outline">
            Browse Services
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Review Your Selection</h1>
              <p className="text-muted-foreground">
                {items.length} service{items.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Button onClick={onBack} variant="outline" size="sm">
              Edit Services
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Cart Items */}
        <div className="space-y-4 mb-8">
          {items.map((item, index) => (
            <CartItemCard
              key={item.id}
              item={item}
              index={index}
              onEdit={() => onEdit(item.id)}
              onRemove={() => onRemove(item.id)}
            />
          ))}
        </div>


        {/* Summary */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Services</span>
                <span>{items.length} service{items.length !== 1 ? 's' : ''}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Total Duration</span>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{totalDuration} minutes</span>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total Price</span>
                <span>${totalPrice}</span>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
      
      {/* Sticky Action Bar */}
      <StickyActionBar
        onAction={onContinue}
        actionText="Continue to Staff & Time"
        className="text-lg"
      />
    </div>
  );
};

// Cart Item Card Component
const CartItemCard: React.FC<{
  item: CartItem;
  index: number;
  onEdit: () => void;
  onRemove: () => void;
}> = ({
  item,
  index,
  onEdit,
  onRemove,
}) => {

  return (
    <Card className="group transition-all duration-200 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Drag Handle */}
          <div className="flex-shrink-0 mt-2">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Service Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-base">{item.service.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {item.service.description}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Badge variant="outline" className="text-xs">
                  ${item.service.price}
                </Badge>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span className="text-xs">{item.service.duration}m</span>
                </div>
              </div>
            </div>

          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onEdit}
              className="h-8 w-8 p-0"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onRemove}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
