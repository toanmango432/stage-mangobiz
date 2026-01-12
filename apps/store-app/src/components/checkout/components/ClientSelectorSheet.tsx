import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import ClientSelector, { type Client } from "../ClientSelector";

export interface ClientSelectorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectClient: (client: Client) => void;
  onCreateClient: (client: Partial<Client>) => void;
}

export function ClientSelectorSheet({
  open,
  onOpenChange,
  onSelectClient,
  onCreateClient,
}: ClientSelectorSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={"right" as const} className="w-full sm:max-w-md p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>Select Client</SheetTitle>
          <SheetDescription>
            Search for an existing client or create a new one
          </SheetDescription>
        </SheetHeader>
        <div className="px-6 py-4 overflow-y-auto h-[calc(100vh-120px)]">
          <ClientSelector
            selectedClient={null}
            onSelectClient={(client) => {
              if (client) {
                onSelectClient(client);
              }
              onOpenChange(false);
            }}
            onCreateClient={(newClient) => {
              onCreateClient(newClient);
              onOpenChange(false);
            }}
            inDialog={true}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
