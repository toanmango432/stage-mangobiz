import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CatalogTable, Column } from "@/components/admin/catalog/CatalogTable";
import { SearchFilter } from "@/components/admin/catalog/SearchFilter";
import { BulkActions } from "@/components/admin/catalog/BulkActions";
import { Service } from "@/types/catalog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { generateMockServices } from "@/lib/mockData";

export default function Services() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [filterValue, setFilterValue] = useState("all");
  const [sortValue, setSortValue] = useState("name");

  useEffect(() => {
    const stored = localStorage.getItem("catalog_services");
    if (stored) {
      setServices(JSON.parse(stored) as Service[]);
    } else {
      // Initialize with 40 nail salon services
      const mockServices = generateMockServices() as Service[];
      localStorage.setItem("catalog_services", JSON.stringify(mockServices));
      setServices(mockServices);
    }
  }, []);

  const saveServices = (updatedServices: Service[]) => {
    setServices(updatedServices);
    localStorage.setItem("catalog_services", JSON.stringify(updatedServices));
  };

  const filteredServices = services
    .filter((service) => {
      const matchesSearch = service.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        service.description.toLowerCase().includes(searchValue.toLowerCase());
      const matchesFilter = filterValue === "all" || service.category === filterValue;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortValue === "name") return a.name.localeCompare(b.name);
      if (sortValue === "price") return a.basePrice - b.basePrice;
      if (sortValue === "duration") return a.duration - b.duration;
      return 0;
    });

  const columns: Column[] = [
    { key: "name", label: "Name" },
    { key: "category", label: "Category" },
    {
      key: "duration",
      label: "Duration",
      render: (value) => `${value} min`,
    },
    {
      key: "basePrice",
      label: "Price",
      render: (value) => `$${value}`,
    },
    {
      key: "showOnline",
      label: "Visibility",
      render: (value) => (
        <Badge variant={value ? "secondary" : "outline"}>
          {value ? "Online" : "Hidden"}
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
    setSelectedItems(checked ? filteredServices.map((s) => s.id) : []);
  };

  const handleDelete = (service: Service) => {
    saveServices(services.filter((s) => s.id !== service.id));
    toast.success("Service deleted");
  };

  const handleBulkDelete = () => {
    saveServices(services.filter((s) => !selectedItems.includes(s.id)));
    setSelectedItems([]);
    toast.success(`${selectedItems.length} services deleted`);
  };

  const handleBulkShowOnline = () => {
    const updated = services.map((s) =>
      selectedItems.includes(s.id) ? { ...s, showOnline: true } : s
    );
    saveServices(updated);
    setSelectedItems([]);
    toast.success("Services shown online");
  };

  const handleBulkHideOnline = () => {
    const updated = services.map((s) =>
      selectedItems.includes(s.id) ? { ...s, showOnline: false } : s
    );
    saveServices(updated);
    setSelectedItems([]);
    toast.success("Services hidden online");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Services</h1>
          <p className="text-muted-foreground">Manage your service catalog</p>
        </div>
        <Button onClick={() => router.push("/admin/catalog/services/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      </div>

      <SearchFilter
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        filterValue={filterValue}
        onFilterChange={setFilterValue}
        filterOptions={[
          { label: "Classic Manicure", value: "Classic Manicure" },
          { label: "Gel & Shellac", value: "Gel & Shellac" },
          { label: "Specialty Manicure", value: "Specialty Manicure" },
          { label: "Classic Pedicure", value: "Classic Pedicure" },
          { label: "Spa Pedicure", value: "Spa Pedicure" },
          { label: "Nail Enhancement", value: "Nail Enhancement" },
          { label: "Nail Art", value: "Nail Art" },
          { label: "Specialty Service", value: "Specialty Service" },
        ]}
        sortValue={sortValue}
        onSortChange={setSortValue}
        sortOptions={[
          { label: "Name", value: "name" },
          { label: "Price", value: "price" },
          { label: "Duration", value: "duration" },
        ]}
      />

      <BulkActions
        selectedCount={selectedItems.length}
        onDelete={handleBulkDelete}
        onShowOnline={handleBulkShowOnline}
        onHideOnline={handleBulkHideOnline}
        onClear={() => setSelectedItems([])}
      />

      <CatalogTable
        columns={columns}
        data={filteredServices}
        selectedItems={selectedItems}
        onSelectItem={handleSelectItem}
        onSelectAll={handleSelectAll}
        onEdit={(service) => router.push(`/admin/catalog/services/${service.id}`)}
        onDelete={handleDelete}
        onDuplicate={(service) => {
          const newService = {
            ...service,
            id: Date.now().toString(),
            name: `${service.name} (Copy)`,
          };
          saveServices([...services, newService]);
          toast.success("Service duplicated");
        }}
      />
    </div>
  );
}
