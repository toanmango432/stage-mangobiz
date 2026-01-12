import {
  ChevronDown,
  LogIn,
  RotateCcw,
  User,
  UserPlus,
  AlertCircle,
  Trash2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Client } from "../ClientSelector";
import type { TicketService } from "../ServiceList";

export interface TicketHeaderProps {
  selectedClient: Client | null;
  services: TicketService[];
  onOpenClientProfile: () => void;
  onOpenClientSelector: () => void;
  onRemoveClient: () => void;
  onCheckIn: () => void;
  onReset: () => void;
}

export function TicketHeader({
  selectedClient,
  services,
  onOpenClientProfile,
  onOpenClientSelector,
  onRemoveClient,
  onCheckIn,
  onReset,
}: TicketHeaderProps) {
  const ticketNumber = Date.now().toString().slice(-4);
  const currentTime = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const hasServices = services.length > 0;

  return (
    <div className="flex items-center justify-between px-3 py-3 border-b border-gray-100">
      {/* Left: Unified ticket info + client */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {selectedClient ? (
          <>
            {/* Client Avatar - Clickable to view profile */}
            <button
              onClick={onOpenClientProfile}
              className="h-11 w-11 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0 shadow-sm ring-2 ring-white hover:ring-primary/30 transition-all cursor-pointer"
            >
              <span className="text-sm font-bold text-gray-600">
                {selectedClient.firstName?.[0]}
                {selectedClient.lastName?.[0]}
              </span>
            </button>
            {/* Ticket + Client Info */}
            <div className="min-w-0 flex-1">
              {/* Ticket # and time */}
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-0.5">
                <span className="font-medium">#{ticketNumber}</span>
                <span>•</span>
                <span>{currentTime}</span>
              </div>
              {/* Client name + loyalty badge - clickable with dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left">
                    <span className="font-semibold text-gray-900 truncate">
                      {selectedClient.firstName} {selectedClient.lastName}
                    </span>
                    {selectedClient.loyaltyStatus && (
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${
                          selectedClient.loyaltyStatus === "gold"
                            ? "bg-amber-100 text-amber-700"
                            : selectedClient.loyaltyStatus === "silver"
                              ? "bg-gray-200 text-gray-600"
                              : "bg-orange-100 text-orange-600"
                        }`}
                      >
                        {selectedClient.loyaltyStatus}
                      </span>
                    )}
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem onClick={onOpenClientSelector}>
                    <User className="mr-2 h-4 w-4" />
                    Change Client
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onOpenClientProfile}>
                    <AlertCircle className="mr-2 h-4 w-4" />
                    View Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={onRemoveClient}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove Client
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {/* Client metrics */}
              <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                <span>{selectedClient.totalVisits || 0} visits</span>
                <span>•</span>
                <span>
                  ${(selectedClient.lifetimeSpend || 0).toLocaleString()} spent
                </span>
              </div>
            </div>
          </>
        ) : (
          /* Prominent Add Client Button */
          <button
            onClick={onOpenClientSelector}
            className="flex items-center gap-3 px-4 py-2.5 bg-primary/10 hover:bg-primary/15 border border-primary/20 rounded-xl transition-all group"
          >
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-0.5">
                <span className="font-medium">#{ticketNumber}</span>
                <span>•</span>
                <span>{currentTime}</span>
              </div>
              <span className="font-semibold text-primary">Add Client</span>
            </div>
          </button>
        )}
      </div>
      {/* Right: Action icons */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onCheckIn}
              disabled={!hasServices}
              className="h-10 w-10 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              <LogIn className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Check in client</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onReset}
              disabled={!hasServices}
              className="h-10 w-10 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Clear cart</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
