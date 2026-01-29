import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { CatalogTable, Column } from "@/components/admin/catalog/CatalogTable";
import { SearchFilter } from "@/components/admin/catalog/SearchFilter";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import {
  getMembershipPlans,
  deleteMembershipPlan
} from "@/lib/services/catalogSyncService";
import type { MembershipPlan } from "@/types/catalog";
import { useStoreContext } from "@/hooks/useStoreContext";

export default function Memberships() {
  const navigate = useNavigate();
  const { storeId } = useStoreContext();
  const [memberships, setMemberships] = useState<MembershipPlan[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMemberships();
  }, []);

  async function loadMemberships() {
    try {
      setIsLoading(true);
      setError(null);
      const plans = await getMembershipPlans(storeId);
      setMemberships(plans);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load membership plans";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredMemberships = memberships.filter((membership) =>
    membership.displayName.toLowerCase().includes(searchValue.toLowerCase()) ||
    membership.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const columns: Column<MembershipPlan>[] = [
    {
      key: "displayName",
      label: "Plan Name",
      render: (value, item) => (
        <div>
          {value}
          {item.isPopular && (
            <Badge variant="secondary" className="ml-2 text-xs">Most Popular</Badge>
          )}
        </div>
      ),
    },
    {
      key: "priceMonthly",
      label: "Price",
      render: (value) => `$${value}/month`,
    },
    {
      key: "description",
      label: "Description",
      render: (value) => (
        <span className="text-sm text-muted-foreground">{value}</span>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      render: (value) => (
        <Badge variant={value ? "secondary" : "outline"}>
          {value ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  const handleSelectItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedItems(checked ? filteredMemberships.map((m) => m.id) : []);
  };

  const handleDelete = async (membership: MembershipPlan) => {
    if (!confirm(`Delete membership plan "${membership.displayName}"?`)) return;

    try {
      await deleteMembershipPlan(membership.id);
      setMemberships((prev) => prev.filter((m) => m.id !== membership.id));
      toast.success("Membership plan deleted");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete membership plan";
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Memberships</h1>
            <p className="text-muted-foreground">Manage membership plans for your store</p>
          </div>
        </div>
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-center">
          <p className="text-sm text-destructive mb-2">{error}</p>
          <Button variant="outline" size="sm" onClick={loadMemberships}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Memberships</h1>
          <p className="text-muted-foreground">Manage membership plans for your store</p>
        </div>
        <Button onClick={() => navigate("/admin/catalog/memberships/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Add Plan
        </Button>
      </div>

      <SearchFilter
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      />

      <CatalogTable
        columns={columns}
        data={filteredMemberships}
        selectedItems={selectedItems}
        onSelectItem={handleSelectItem}
        onSelectAll={handleSelectAll}
        onEdit={(membership) => navigate(`/admin/catalog/memberships/${membership.id}`)}
        onDelete={handleDelete}
      />
    </div>
  );
}
