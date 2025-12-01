/**
 * BlockedTimeTypesSettings Component
 * Settings panel for managing blocked time types (Break, Meeting, Training, etc.)
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/Badge';
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useAllBlockedTimeTypes, useBlockedTimeTypeMutations, type ScheduleContext } from '@/hooks/useSchedule';
import type { BlockedTimeType } from '@/types/schedule';

interface BlockedTimeTypesSettingsProps {
  storeId: string;
  context: ScheduleContext;
  onEditType: (typeId: string) => void;
  onCreateType: () => void;
}

export function BlockedTimeTypesSettings({
  storeId,
  context,
  onEditType,
  onCreateType,
}: BlockedTimeTypesSettingsProps) {
  const { types, loading, error, refetch } = useAllBlockedTimeTypes(storeId);
  const { update, remove, seed, loading: mutationLoading } = useBlockedTimeTypeMutations(context);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleToggleActive = async (type: BlockedTimeType) => {
    try {
      await update(type.id, { isActive: !type.isActive });
    } catch (err) {
      console.error('Failed to toggle blocked time type:', err);
    }
  };

  const handleDelete = async (type: BlockedTimeType) => {
    if (type.isSystemDefault) {
      return; // Cannot delete system defaults
    }

    setDeletingId(type.id);
    try {
      await remove(type.id);
    } catch (err) {
      console.error('Failed to delete blocked time type:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSeedDefaults = async () => {
    try {
      await seed();
      refetch();
    } catch (err) {
      console.error('Failed to seed default types:', err);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Blocked Time Types
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Blocked Time Types
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
          <Button variant="outline" onClick={() => refetch()} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Blocked Time Types
            </CardTitle>
            <CardDescription>
              Manage categories for blocking staff time (breaks, meetings, training, etc.)
            </CardDescription>
          </div>
          <Button onClick={onCreateType} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Type
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {types.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No blocked time types configured</p>
            <Button variant="outline" onClick={handleSeedDefaults} disabled={mutationLoading}>
              Add Default Types
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {types.map((type) => (
              <div
                key={type.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  type.isActive ? 'bg-background' : 'bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                    style={{ backgroundColor: `${type.color}20`, color: type.color }}
                  >
                    {type.emoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${!type.isActive ? 'text-muted-foreground' : ''}`}>
                        {type.name}
                      </span>
                      {type.isSystemDefault && (
                        <Badge variant="secondary" className="text-xs">
                          Default
                        </Badge>
                      )}
                      {type.isPaid && (
                        <Badge variant="outline" className="text-xs">
                          Paid
                        </Badge>
                      )}
                    </div>
                    {type.description && (
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={type.isActive}
                    onCheckedChange={() => handleToggleActive(type)}
                    disabled={mutationLoading}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEditType(type.id)}
                    disabled={mutationLoading}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {!type.isSystemDefault && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(type)}
                      disabled={mutationLoading || deletingId === type.id}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default BlockedTimeTypesSettings;
