import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Search, Plus, AlertTriangle, ChevronDown, UserCircle, Trash2, RefreshCw, X, Edit2, Save } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { selectClients } from "@/store/slices/clientsSlice";
import type { Client as ReduxClient } from "@/types";

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  allergies?: string[];
  notes?: string;
  loyaltyStatus?: "bronze" | "silver" | "gold";
  rewardPoints?: number;
  totalVisits?: number;
  lifetimeSpend?: number;
  lastVisitDate?: string;
  // Alert-related fields
  staffAlert?: {
    message: string;
    createdAt?: string;
    createdBy?: string;
    createdByName?: string;
  };
  outstandingBalance?: number;
  isBlocked?: boolean;
  blockReason?: string;
  blockReasonNote?: string;
}

interface ClientSelectorProps {
  selectedClient: Client | null;
  onSelectClient: (client: Client | null) => void;
  onCreateClient: (client: Partial<Client>) => void;
  inDialog?: boolean;
}

// Helper function to convert Redux client to local Client format
const convertReduxClient = (reduxClient: ReduxClient): Client => ({
  id: reduxClient.id,
  firstName: reduxClient.firstName,
  lastName: reduxClient.lastName,
  phone: reduxClient.phone || '',
  email: reduxClient.email,
  allergies: reduxClient.medicalInfo?.allergies,
  notes: typeof reduxClient.notes === 'string' ? reduxClient.notes : undefined,
  loyaltyStatus: reduxClient.loyaltyInfo?.tier as 'bronze' | 'silver' | 'gold' | undefined,
  rewardPoints: reduxClient.loyaltyInfo?.pointsBalance,
  totalVisits: reduxClient.visitSummary?.totalVisits,
  lifetimeSpend: reduxClient.visitSummary?.totalSpent,
  lastVisitDate: reduxClient.visitSummary?.lastVisitDate,
  staffAlert: reduxClient.staffAlert,
  outstandingBalance: reduxClient.outstandingBalance,
  isBlocked: reduxClient.isBlocked,
  blockReason: reduxClient.blockReason,
  blockReasonNote: reduxClient.blockReasonNote,
});

// LocalStorage utilities for recent clients
const RECENT_CLIENTS_KEY = "mango_pos_recent_clients";
const MAX_RECENT_CLIENTS = 10;

const getRecentClients = (): Client[] => {
  try {
    const stored = localStorage.getItem(RECENT_CLIENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveRecentClient = (client: Client) => {
  try {
    const recent = getRecentClients();
    // Remove if already exists
    const filtered = recent.filter((c) => c.id !== client.id);
    // Add to front
    const updated = [client, ...filtered].slice(0, MAX_RECENT_CLIENTS);
    localStorage.setItem(RECENT_CLIENTS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to save recent client:", error);
  }
};

export default function ClientSelector({
  selectedClient,
  onSelectClient,
  onCreateClient,
  inDialog = false,
}: ClientSelectorProps) {
  // Get clients from Redux store
  const reduxClients = useAppSelector(selectClients);

  // Convert Redux clients to local Client format
  const allClients = useMemo(() => {
    return reduxClients.map(convertReduxClient);
  }, [reduxClients]);

  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [showClientProfile, setShowClientProfile] = useState(false);
  const [showClientSelector, setShowClientSelector] = useState(false);
  const [recentClients, setRecentClients] = useState<Client[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [editedClient, setEditedClient] = useState<Partial<Client>>({});
  const [newClient, setNewClient] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });

  // Load recent clients on mount
  useEffect(() => {
    setRecentClients(getRecentClients());
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue]);

  const handleCreateClient = () => {
    if (newClient.firstName && newClient.lastName && newClient.phone) {
      onCreateClient(newClient);
      setShowNewClientForm(false);
      setNewClient({ firstName: "", lastName: "", phone: "" });
    }
  };

  const handleSelectClient = (client: Client | null) => {
    if (client && client.id) {
      saveRecentClient(client);
      setRecentClients(getRecentClients());
    }
    onSelectClient(client);
    setSelectedIndex(-1);
  };

  const handleSaveEdit = () => {
    if (selectedClient && editedClient.firstName && editedClient.lastName && editedClient.phone) {
      const updatedClient = { ...selectedClient, ...editedClient };
      handleSelectClient(updatedClient);
      setIsEditMode(false);
      setEditedClient({});
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedClient({});
  };

  const filteredClients = allClients.filter((client) => {
    const searchLower = debouncedSearch.toLowerCase();
    const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
    const phone = client.phone.toLowerCase();
    const email = client.email?.toLowerCase() || "";
    return fullName.includes(searchLower) || phone.includes(searchLower) || email.includes(searchLower);
  });

  // Combine filtered clients with recent clients for display
  const getDisplayClients = (): Client[] | { recent: Client[]; other: Client[] } => {
    if (debouncedSearch) {
      return filteredClients;
    }

    // Show recent clients when not searching
    const recentIds = recentClients.map(c => c.id);
    const otherClients = allClients.filter(c => !recentIds.includes(c.id));
    return { recent: recentClients.slice(0, 5), other: otherClients };
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showClientSelector || showNewClientForm) return;

      const displayClients = getDisplayClients();
      const allClients = Array.isArray(displayClients)
        ? displayClients
        : [...displayClients.recent, ...displayClients.other];
      
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < allClients.length - 1 ? prev + 1 : prev));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault();
        handleSelectClient(allClients[selectedIndex]);
        setShowClientSelector(false);
      }
    };

    if (showClientSelector) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [showClientSelector, showNewClientForm, selectedIndex, filteredClients, debouncedSearch]);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getLoyaltyColor = (status?: string) => {
    switch (status) {
      case "gold":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
      case "silver":
        return "bg-gray-400/10 text-gray-700 dark:text-gray-400";
      case "bronze":
        return "bg-amber-600/10 text-amber-700 dark:text-amber-400";
      default:
        return "";
    }
  };

  // Selected client view - Compact inline design
  if (selectedClient) {
    return (
      <>
        {isEditMode ? (
          // Edit Mode - Full card for editing
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Edit Client</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium mb-1 block">First Name</label>
                  <Input
                    value={editedClient.firstName ?? selectedClient.firstName}
                    onChange={(e) => setEditedClient({ ...editedClient, firstName: e.target.value })}
                    placeholder="First name"
                    className="h-9"
                    data-testid="input-edit-first-name"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Last Name</label>
                  <Input
                    value={editedClient.lastName ?? selectedClient.lastName}
                    onChange={(e) => setEditedClient({ ...editedClient, lastName: e.target.value })}
                    placeholder="Last name"
                    className="h-9"
                    data-testid="input-edit-last-name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium mb-1 block">Phone</label>
                  <Input
                    value={editedClient.phone ?? selectedClient.phone}
                    onChange={(e) => setEditedClient({ ...editedClient, phone: e.target.value })}
                    placeholder="Phone"
                    className="h-9"
                    data-testid="input-edit-phone"
                  />
                </div>
                {selectedClient.email !== undefined && (
                  <div>
                    <label className="text-xs font-medium mb-1 block">Email</label>
                    <Input
                      value={editedClient.email ?? selectedClient.email ?? ""}
                      onChange={(e) => setEditedClient({ ...editedClient, email: e.target.value })}
                      placeholder="Email"
                      className="h-9"
                      data-testid="input-edit-email"
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  onClick={handleSaveEdit}
                  size="sm"
                  className="flex-1"
                  disabled={
                    !editedClient.firstName && !selectedClient.firstName ||
                    !editedClient.lastName && !selectedClient.lastName ||
                    !editedClient.phone && !selectedClient.phone
                  }
                  data-testid="button-save-edit"
                >
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  Save
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          // View Mode - Compact card with inline metrics
          <div className="bg-white rounded-lg border border-gray-200 px-3 py-2.5">
            <div className="flex items-center gap-3">
              <Avatar
                className="h-10 w-10 flex-shrink-0 cursor-pointer"
                onClick={() => setShowClientProfile(true)}
                data-testid="avatar-client"
              >
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {getInitials(selectedClient.firstName, selectedClient.lastName)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm text-gray-900 truncate" data-testid="text-client-name">
                    {selectedClient.firstName} {selectedClient.lastName}
                  </span>
                  {selectedClient.loyaltyStatus && (
                    <Badge
                      variant="secondary"
                      className={`text-[10px] px-1.5 py-0 h-4 font-medium ${getLoyaltyColor(selectedClient.loyaltyStatus)}`}
                    >
                      {selectedClient.loyaltyStatus}
                    </Badge>
                  )}
                </div>
                {/* Inline metrics */}
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {selectedClient.totalVisits || 0} visits
                  <span className="mx-1.5">•</span>
                  ${selectedClient.lifetimeSpend || 0} spent
                  {selectedClient.lastVisitDate && (
                    <>
                      <span className="mx-1.5">•</span>
                      Last: {new Date(selectedClient.lastVisitDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </>
                  )}
                </p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 flex-shrink-0"
                    data-testid="button-client-actions"
                  >
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowClientProfile(true)} data-testid="action-view-profile">
                    <UserCircle className="mr-2 h-4 w-4" />
                    View Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    setIsEditMode(true);
                    setEditedClient({
                      firstName: selectedClient.firstName,
                      lastName: selectedClient.lastName,
                      phone: selectedClient.phone,
                      email: selectedClient.email,
                    });
                  }} data-testid="action-quick-edit">
                    <Edit2 className="mr-2 h-4 w-4" />
                    Quick Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onSelectClient(null)} data-testid="action-change-client">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Change Client
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onSelectClient(null)}
                    className="text-destructive focus:text-destructive"
                    data-testid="action-remove-client"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}

        {/* Compact Allergy Alert - Only if allergies exist */}
        {!isEditMode && selectedClient.allergies && selectedClient.allergies.length > 0 && (
          <div className="mt-2 px-2 py-1.5 bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
            <p className="text-xs text-destructive truncate">
              <span className="font-medium">Allergy:</span> {selectedClient.allergies.join(", ")}
            </p>
          </div>
        )}

        {/* Client Profile Dialog - Full Comprehensive Profile */}
        <Dialog open={showClientProfile} onOpenChange={setShowClientProfile}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-medium">
                      {getInitials(selectedClient.firstName, selectedClient.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-2xl">
                      {selectedClient.firstName} {selectedClient.lastName}
                    </DialogTitle>
                    {selectedClient.loyaltyStatus && (
                      <Badge
                        variant="secondary"
                        className={`mt-1 ${getLoyaltyColor(selectedClient.loyaltyStatus)}`}
                      >
                        {selectedClient.loyaltyStatus}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <p className="text-base mt-1">{selectedClient.phone}</p>
                  </Card>
                  {selectedClient.email && (
                    <Card className="p-4">
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="text-base mt-1">{selectedClient.email}</p>
                    </Card>
                  )}
                </div>
              </div>

              {/* Health & Preferences */}
              {(selectedClient.allergies?.length || selectedClient.notes) && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Health & Preferences</h3>
                    <div className="space-y-3">
                      {selectedClient.allergies && selectedClient.allergies.length > 0 && (
                        <Card className="p-4 bg-destructive/5 border-destructive/20">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <label className="text-sm font-medium text-destructive">Allergies</label>
                              <p className="text-sm text-destructive/90 mt-1">
                                {selectedClient.allergies.join(", ")}
                              </p>
                            </div>
                          </div>
                        </Card>
                      )}
                      {selectedClient.notes && (
                        <Card className="p-4">
                          <label className="text-sm font-medium text-muted-foreground">Notes</label>
                          <p className="text-base mt-1">{selectedClient.notes}</p>
                        </Card>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Appointment History */}
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3">Recent Appointments</h3>
                <div className="space-y-2">
                  <Card className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">Haircut - Women</p>
                        <p className="text-sm text-muted-foreground mt-1">with Sarah Johnson</p>
                        <p className="text-xs text-muted-foreground mt-1">January 15, 2025</p>
                      </div>
                      <p className="font-medium">$65.00</p>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">Color - Full</p>
                        <p className="text-sm text-muted-foreground mt-1">with Sarah Johnson</p>
                        <p className="text-xs text-muted-foreground mt-1">December 20, 2024</p>
                      </div>
                      <p className="font-medium">$120.00</p>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">Highlights</p>
                        <p className="text-sm text-muted-foreground mt-1">with Mike Chen</p>
                        <p className="text-xs text-muted-foreground mt-1">November 10, 2024</p>
                      </div>
                      <p className="font-medium">$150.00</p>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Stats */}
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3">Statistics</h3>
                <div className="grid grid-cols-3 gap-3">
                  <Card className="p-4 text-center">
                    <p className="text-2xl font-bold text-primary">12</p>
                    <p className="text-xs text-muted-foreground mt-1">Total Visits</p>
                  </Card>
                  <Card className="p-4 text-center">
                    <p className="text-2xl font-bold text-primary">$945</p>
                    <p className="text-xs text-muted-foreground mt-1">Lifetime Value</p>
                  </Card>
                  <Card className="p-4 text-center">
                    <p className="text-2xl font-bold text-primary">3m</p>
                    <p className="text-xs text-muted-foreground mt-1">Last Visit</p>
                  </Card>
                </div>
              </div>

              {/* Actions */}
              <Separator />
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowClientProfile(false)}
                  data-testid="button-close-profile"
                >
                  Close
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setShowClientProfile(false);
                    onSelectClient(null);
                  }}
                  data-testid="button-change-from-profile"
                >
                  Change Client
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // When shown in dialog, use full layout
  if (inDialog) {
    if (showNewClientForm) {
      return (
        <div className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                First Name *
              </label>
              <Input
                value={newClient.firstName}
                onChange={(e) =>
                  setNewClient({ ...newClient, firstName: e.target.value })
                }
                placeholder="Enter first name"
                data-testid="input-first-name"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Last Name *
              </label>
              <Input
                value={newClient.lastName}
                onChange={(e) =>
                  setNewClient({ ...newClient, lastName: e.target.value })
                }
                placeholder="Enter last name"
                data-testid="input-last-name"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Phone *
              </label>
              <Input
                value={newClient.phone}
                onChange={(e) =>
                  setNewClient({ ...newClient, phone: e.target.value })
                }
                placeholder="(555) 123-4567"
                data-testid="input-phone"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleCreateClient}
                className="flex-1"
                disabled={
                  !newClient.firstName ||
                  !newClient.lastName ||
                  !newClient.phone
                }
                data-testid="button-save-client"
              >
                Save
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewClientForm(false);
                  setNewClient({ firstName: "", lastName: "", phone: "" });
                }}
                data-testid="button-cancel-new-client"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search existing client"
            className="pl-10 h-11"
            data-testid="input-search-client"
            autoFocus
          />
        </div>

        {/* Action Card - Add New Client */}
        <Card
          className="p-4 hover-elevate active-elevate-2 cursor-pointer border-dashed"
          onClick={() => setShowNewClientForm(true)}
          data-testid="option-new-client"
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <span className="font-medium">Add new client</span>
          </div>
        </Card>

        {/* Empty State when search returns no results */}
        {debouncedSearch && filteredClients.length === 0 && (
          <>
            <Separator />
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserCircle className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">No Clients Found</h3>
                  <p className="text-sm text-muted-foreground">
                    No clients match "{debouncedSearch}". Try a different search or add them as a new client.
                  </p>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* All Clients List */}
        {(debouncedSearch ? filteredClients.length > 0 : allClients.length > 0) && (
          <div>
            <h3 className="text-sm font-medium mb-2" data-testid="heading-all-clients">
              {debouncedSearch ? 'Search Results' : 'All Clients'}
            </h3>
            <div className="space-y-1">
              {(debouncedSearch ? filteredClients : allClients).map((client: Client, index: number) => (
                <Card
                  key={client.id}
                  className={`p-3 hover-elevate active-elevate-2 cursor-pointer ${selectedIndex === index ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => handleSelectClient(client)}
                  data-testid={`client-option-${client.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                        {getInitials(client.firstName, client.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm">
                        {client.firstName} {client.lastName}
                      </h3>
                      <p className="text-xs text-muted-foreground">{client.phone}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
        <Button
          variant="outline"
          className="w-full justify-start h-11 pl-10 font-normal text-muted-foreground hover:text-foreground bg-background"
          onClick={() => setShowClientSelector(true)}
          data-testid="button-select-client"
        >
          Client
        </Button>
      </div>

      {/* Mobile Dialog for Client Selection */}
      <Dialog open={showClientSelector} onOpenChange={(open) => {
        setShowClientSelector(open);
        if (!open) {
          setShowNewClientForm(false);
          setNewClient({ firstName: "", lastName: "", phone: "" });
          setSearchValue("");
          setSelectedIndex(-1);
        }
      }}>
        <DialogContent className="max-w-full sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <DialogTitle className="text-lg">
              {showNewClientForm ? "Add New Client" : "Select Client"}
            </DialogTitle>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                aria-label="Close client selector"
                data-testid="button-close-client-dialog"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </DialogHeader>
          
          <div className="mt-4">
            {showNewClientForm ? (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      First Name *
                    </label>
                    <Input
                      value={newClient.firstName}
                      onChange={(e) =>
                        setNewClient({ ...newClient, firstName: e.target.value })
                      }
                      placeholder="Enter first name"
                      data-testid="input-first-name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Last Name *
                    </label>
                    <Input
                      value={newClient.lastName}
                      onChange={(e) =>
                        setNewClient({ ...newClient, lastName: e.target.value })
                      }
                      placeholder="Enter last name"
                      data-testid="input-last-name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Phone *
                    </label>
                    <Input
                      value={newClient.phone}
                      onChange={(e) =>
                        setNewClient({ ...newClient, phone: e.target.value })
                      }
                      placeholder="(555) 123-4567"
                      data-testid="input-phone"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => {
                        if (newClient.firstName && newClient.lastName && newClient.phone) {
                          onCreateClient(newClient);
                          setShowNewClientForm(false);
                          setShowClientSelector(false);
                          setNewClient({ firstName: "", lastName: "", phone: "" });
                        }
                      }}
                      className="flex-1"
                      disabled={
                        !newClient.firstName ||
                        !newClient.lastName ||
                        !newClient.phone
                      }
                      data-testid="button-save-client"
                    >
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowNewClientForm(false);
                        setNewClient({ firstName: "", lastName: "", phone: "" });
                      }}
                      data-testid="button-cancel-new-client"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder="Search existing client"
                    className="pl-10 h-11"
                    data-testid="input-search-client"
                    autoFocus
                  />
                </div>

                {/* Action Card - Add New Client */}
                <Card
                  className="p-4 hover-elevate active-elevate-2 cursor-pointer border-dashed"
                  onClick={() => setShowNewClientForm(true)}
                  data-testid="option-new-client"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Plus className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-medium">Add new client</span>
                  </div>
                </Card>

                {/* Empty State when search returns no results */}
                {debouncedSearch && filteredClients.length === 0 && (
                  <Card className="p-8 text-center">
                    <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserCircle className="h-8 w-8 text-primary" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg">No Clients Found</h3>
                        <p className="text-sm text-muted-foreground">
                          No clients match "{debouncedSearch}". Try a different search or add them as a new client.
                        </p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* All Clients List */}
                {(debouncedSearch ? filteredClients.length > 0 : allClients.length > 0) && (
                  <div>
                    <h3 className="text-sm font-medium mb-2" data-testid="heading-all-clients">
                      {debouncedSearch ? 'Search Results' : 'All Clients'}
                    </h3>
                    <div className="space-y-1">
                      {(debouncedSearch ? filteredClients : allClients).map((client: Client, index: number) => (
                        <Card
                          key={client.id}
                          className={`p-3 hover-elevate active-elevate-2 cursor-pointer ${selectedIndex === index ? 'ring-2 ring-primary' : ''}`}
                          onClick={() => {
                            handleSelectClient(client);
                            setShowClientSelector(false);
                            setSearchValue("");
                          }}
                          data-testid={`client-option-${client.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 flex-shrink-0">
                              <AvatarImage src="" />
                              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                                {getInitials(client.firstName, client.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm">
                                {client.firstName} {client.lastName}
                              </h3>
                              <p className="text-xs text-muted-foreground">{client.phone}</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
