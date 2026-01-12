import { Phone, Mail, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/separator";
import type { Client } from "../ClientSelector";

interface ClientProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  onChangeClient: () => void;
}

export function ClientProfileDialog({
  open,
  onOpenChange,
  client,
  onChangeClient,
}: ClientProfileDialogProps) {
  if (!client) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">
                {client.firstName?.[0]}{client.lastName?.[0]}
              </span>
            </div>
            <div>
              <DialogTitle className="text-2xl">
                {client.firstName} {client.lastName}
              </DialogTitle>
              {client.loyaltyStatus && (
                <Badge className={`mt-1 ${
                  client.loyaltyStatus === 'gold'
                    ? 'bg-amber-100 text-amber-700'
                    : client.loyaltyStatus === 'silver'
                      ? 'bg-gray-200 text-gray-600'
                      : 'bg-orange-100 text-orange-600'
                }`}>
                  {client.loyaltyStatus.toUpperCase()} Member
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Contact Information */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Card className="p-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium">{client.phone}</p>
                </div>
              </Card>
              {client.email && (
                <Card className="p-3 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{client.email}</p>
                  </div>
                </Card>
              )}
            </div>
          </div>

          {/* Statistics */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Statistics</h3>
            <div className="grid grid-cols-3 gap-3">
              <Card className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{client.totalVisits || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Visits</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">${(client.lifetimeSpend || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Lifetime Spend</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{client.rewardPoints || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Reward Points</p>
              </Card>
            </div>
          </div>

          {/* Health & Preferences - Only show if allergies or notes exist */}
          {(client.allergies?.length || client.notes) && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Health & Preferences</h3>
              <div className="space-y-3">
                {client.allergies && client.allergies.length > 0 && (
                  <Card className="p-3 bg-destructive/5 border-destructive/20">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-destructive">Allergies</p>
                        <p className="text-sm text-destructive/80 mt-0.5">
                          {client.allergies.join(", ")}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
                {client.notes && (
                  <Card className="p-3">
                    <p className="text-xs text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm">{client.notes}</p>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <Separator />
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={onChangeClient}
            >
              Change Client
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
