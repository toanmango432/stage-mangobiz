import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Merge, 
  DollarSign, 
  User, 
  AlertCircle, 
  Clock,
  Scissors,
  ArrowRight,
} from "lucide-react";
import { TicketService } from "./ServiceList";
import { Client } from "./ClientSelector";

export interface OpenTicket {
  id: string;
  client: Client | null;
  services: TicketService[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  createdAt: Date;
}

interface MergeTicketsDialogProps {
  open: boolean;
  onClose: () => void;
  currentTicket: {
    client: Client | null;
    services: TicketService[];
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
  };
  openTickets: OpenTicket[];
  onMerge: (ticketIds: string[], keepCurrentClient: boolean) => void;
}

export default function MergeTicketsDialog({
  open,
  onClose,
  currentTicket,
  openTickets,
  onMerge,
}: MergeTicketsDialogProps) {
  const [selectedTicketIds, setSelectedTicketIds] = useState<Set<string>>(new Set());
  const [keepCurrentClient, setKeepCurrentClient] = useState(true);

  const toggleTicket = (ticketId: string) => {
    const newSelection = new Set(selectedTicketIds);
    if (newSelection.has(ticketId)) {
      newSelection.delete(ticketId);
    } else {
      newSelection.add(ticketId);
    }
    setSelectedTicketIds(newSelection);
  };

  const selectAll = () => {
    setSelectedTicketIds(new Set(openTickets.map(t => t.id)));
  };

  const clearSelection = () => {
    setSelectedTicketIds(new Set());
  };

  const selectedTickets = openTickets.filter(t => selectedTicketIds.has(t.id));

  const combinedServices = [
    ...currentTicket.services,
    ...selectedTickets.flatMap(t => t.services),
  ];

  const combinedSubtotal = currentTicket.subtotal + 
    selectedTickets.reduce((sum, t) => sum + t.subtotal, 0);
  
  const combinedDiscount = currentTicket.discount + 
    selectedTickets.reduce((sum, t) => sum + t.discount, 0);
  
  const combinedAfterDiscount = combinedSubtotal - combinedDiscount;
  const combinedTax = combinedAfterDiscount * 0.085;
  const combinedTotal = combinedAfterDiscount + combinedTax;

  const canMerge = selectedTicketIds.size > 0;

  const allClients = [
    currentTicket.client,
    ...selectedTickets.map(t => t.client),
  ].filter((c): c is Client => c !== null);

  const uniqueClients = allClients.filter(
    (client, index, self) => self.findIndex(c => c.id === client.id) === index
  );

  const handleMerge = () => {
    if (canMerge) {
      onMerge(Array.from(selectedTicketIds), keepCurrentClient);
      setSelectedTicketIds(new Set());
      setKeepCurrentClient(true);
      onClose();
    }
  };

  const handleCancel = () => {
    setSelectedTicketIds(new Set());
    setKeepCurrentClient(true);
    onClose();
  };

  const getInitials = (client: Client) => {
    return `${client.firstName[0]}${client.lastName[0]}`.toUpperCase();
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 sm:p-6 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Merge className="h-5 w-5 text-primary" />
            <DialogTitle>Merge Tickets</DialogTitle>
          </div>
          <DialogDescription>
            Select tickets to combine with the current ticket for joint payment.
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 sm:px-6 flex-shrink-0">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              All services and discounts from selected tickets will be combined. You can choose which client to keep.
            </AlertDescription>
          </Alert>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
          {openTickets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Scissors className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No other open tickets</p>
              <p className="text-sm mt-1">There are no other tickets available to merge.</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">
                    Select Tickets ({selectedTicketIds.size} of {openTickets.length} selected)
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectAll}
                      disabled={selectedTicketIds.size === openTickets.length}
                      data-testid="button-select-all-tickets"
                    >
                      Select All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSelection}
                      disabled={selectedTicketIds.size === 0}
                      data-testid="button-clear-ticket-selection"
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                <ScrollArea className="h-[220px] border rounded-md">
                  <div className="p-3 space-y-2">
                    {openTickets.map((ticket) => {
                      const isSelected = selectedTicketIds.has(ticket.id);
                      return (
                        <div
                          key={ticket.id}
                          className={`p-3 rounded-md border cursor-pointer transition-colors hover-elevate ${
                            isSelected ? 'bg-primary/10 border-primary' : 'bg-card'
                          }`}
                          onClick={() => toggleTicket(ticket.id)}
                          data-testid={`ticket-merge-${ticket.id}`}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleTicket(ticket.id)}
                              className="mt-1"
                              data-testid={`checkbox-ticket-${ticket.id}`}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {ticket.client ? (
                                    <>
                                      <Avatar className="h-6 w-6">
                                        <AvatarFallback className="text-xs">
                                          {getInitials(ticket.client)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="font-medium text-sm">
                                        {ticket.client.firstName} {ticket.client.lastName}
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                                        <User className="h-3 w-3 text-muted-foreground" />
                                      </div>
                                      <span className="text-sm text-muted-foreground">Walk-in</span>
                                    </>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span>{formatTime(ticket.createdAt)}</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="text-xs text-muted-foreground">
                                  {ticket.services.length} service{ticket.services.length !== 1 ? 's' : ''}
                                  {ticket.services.slice(0, 2).map((s, i) => (
                                    <span key={s.id}>
                                      {i === 0 ? ': ' : ', '}
                                      {s.serviceName}
                                    </span>
                                  ))}
                                  {ticket.services.length > 2 && (
                                    <span className="text-muted-foreground"> +{ticket.services.length - 2} more</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 font-semibold text-sm">
                                  <DollarSign className="h-4 w-4" />
                                  <span>${ticket.total.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>

              {uniqueClients.length > 1 && canMerge && (
                <div className="mb-4">
                  <h3 className="font-semibold text-sm mb-2">Client Assignment</h3>
                  <Card className="p-3">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="client-choice"
                          checked={keepCurrentClient}
                          onChange={() => setKeepCurrentClient(true)}
                          className="h-4 w-4 text-primary"
                          data-testid="radio-keep-current-client"
                        />
                        <span className="text-sm">
                          Keep current ticket's client
                          {currentTicket.client && (
                            <span className="text-muted-foreground">
                              {' '}({currentTicket.client.firstName} {currentTicket.client.lastName})
                            </span>
                          )}
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="client-choice"
                          checked={!keepCurrentClient}
                          onChange={() => setKeepCurrentClient(false)}
                          className="h-4 w-4 text-primary"
                          data-testid="radio-clear-client"
                        />
                        <span className="text-sm">Clear client (merge as walk-in)</span>
                      </label>
                    </div>
                  </Card>
                </div>
              )}

              {canMerge && (
                <>
                  <Separator className="my-4" />
                  <div className="mb-4">
                    <h3 className="font-semibold text-sm mb-3">Merge Preview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Card className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="outline" className="text-xs">Current Ticket</Badge>
                          <span className="text-xs text-muted-foreground">
                            {currentTicket.services.length} service{currentTicket.services.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="font-medium">${currentTicket.subtotal.toFixed(2)}</span>
                          </div>
                          {currentTicket.discount > 0 && (
                            <div className="flex justify-between text-green-600 dark:text-green-400">
                              <span>Discount</span>
                              <span>-${currentTicket.discount.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-semibold">
                            <span>Total</span>
                            <span>${currentTicket.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </Card>

                      <div className="flex items-center justify-center">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="text-sm">+</span>
                          <span className="text-xs">
                            {selectedTicketIds.size} ticket{selectedTicketIds.size !== 1 ? 's' : ''}
                          </span>
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </div>

                      <Card className="p-4 bg-primary/5 border-primary/20">
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="default" className="text-xs">Combined Ticket</Badge>
                          <span className="text-xs text-muted-foreground">
                            {combinedServices.length} service{combinedServices.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="font-medium">${combinedSubtotal.toFixed(2)}</span>
                          </div>
                          {combinedDiscount > 0 && (
                            <div className="flex justify-between text-green-600 dark:text-green-400">
                              <span>Discount</span>
                              <span>-${combinedDiscount.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tax</span>
                            <span className="font-medium">${combinedTax.toFixed(2)}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-semibold text-base">
                            <span>Total</span>
                            <span>${combinedTotal.toFixed(2)}</span>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <DialogFooter className="p-4 sm:p-6 pt-3 border-t flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleCancel}
            data-testid="button-cancel-merge"
          >
            Cancel
          </Button>
          <Button
            onClick={handleMerge}
            disabled={!canMerge}
            className="gap-2"
            data-testid="button-confirm-merge"
          >
            <Merge className="h-4 w-4" />
            Merge {selectedTicketIds.size > 0 ? `${selectedTicketIds.size + 1} Tickets` : 'Tickets'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
