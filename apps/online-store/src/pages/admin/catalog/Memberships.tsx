import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CatalogTable, Column } from "@/components/admin/catalog/CatalogTable";
import { SearchFilter } from "@/components/admin/catalog/SearchFilter";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { 
  getMembershipPlans, 
  deleteMembershipPlan, 
  type MembershipPlan 
} from "@/lib/storage/membershipStorage";

export default function Memberships() {
  const router = useRouter();
  const [memberships, setMemberships] = useState<MembershipPlan[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    loadMemberships();
  }, []);

  function loadMemberships() {
    const plans = getMembershipPlans();
    setMemberships(plans);
  }

  const filteredMemberships = memberships.filter((membership) =>
    membership.displayName.toLowerCase().includes(searchValue.toLowerCase()) ||
    membership.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const columns: Column[] = [
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

  const handleDelete = (membership: MembershipPlan) => {
    if (!confirm(`Delete membership plan "${membership.displayName}"?`)) return;
    
    deleteMembershipPlan(membership.id);
    loadMemberships();
    toast({
      title: "Success",
      description: "Membership plan deleted",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Memberships</h1>
          <p className="text-muted-foreground">Manage membership plans stored in localStorage</p>
        </div>
        <Button onClick={() => router.push("/admin/catalog/memberships/new")}>
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
        onEdit={(membership) => router.push(`/admin/catalog/memberships/${membership.id}`)}
        onDelete={handleDelete}
      />
    </div>
  );
}
