import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CatalogTable, Column } from "@/components/admin/catalog/CatalogTable";
import { SearchFilter } from "@/components/admin/catalog/SearchFilter";
import { BulkActions } from "@/components/admin/catalog/BulkActions";
import { Service } from "@/types/catalog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { getServices, getCategories, deleteService, createService, updateService } from "@/lib/services/catalogSyncService";
import type { Category } from "@/lib/adapters/catalogAdapters";

export default function Services() {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [filterValue, setFilterValue] = useState("all");
  const [sortValue, setSortValue] = useState("name");
  const [categories, setCategories] = useState<Category[]>([]);

  const storeId = localStorage.getItem('storeId') || '';

  const loadServices = async () => {
    try {
      const loadedServices = await getServices(storeId);
      setServices(loadedServices);
    } catch (error) {
      console.error('Failed to load services:', error);
      toast.error('Failed to load services');
      setServices([]);
    }
  };

  useEffect(() => {
    loadServices();

    const loadCategories = async () => {
      try {
        const loadedCategories = await getCategories(storeId);
        setCategories(loadedCategories);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    loadCategories();
  }, []);

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

  const columns: Column<Service>[] = [
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

  const handleDelete = async (service: Service) => {
    try {
      await deleteService(service.id);
      toast.success("Service deleted");
      await loadServices();
    } catch (error) {
      toast.error(`Failed to delete service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedItems.map((id) => deleteService(id)));
      setSelectedItems([]);
      toast.success(`${selectedItems.length} services deleted`);
      await loadServices();
    } catch (error) {
      toast.error(`Failed to delete services: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleBulkShowOnline = async () => {
    try {
      await Promise.all(
        selectedItems.map((id) => updateService(id, { showOnline: true }))
      );
      setSelectedItems([]);
      toast.success("Services shown online");
      await loadServices();
    } catch (error) {
      toast.error(`Failed to update services: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleBulkHideOnline = async () => {
    try {
      await Promise.all(
        selectedItems.map((id) => updateService(id, { showOnline: false }))
      );
      setSelectedItems([]);
      toast.success("Services hidden online");
      await loadServices();
    } catch (error) {
      toast.error(`Failed to update services: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Services</h1>
          <p className="text-muted-foreground">Manage your service catalog</p>
        </div>
        <Button onClick={() => navigate("/admin/catalog/services/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      </div>

      <SearchFilter
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        filterValue={filterValue}
        onFilterChange={setFilterValue}
        filterOptions={categories.map((cat) => ({
          label: cat.name,
          value: cat.id,
        }))}
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
        onEdit={(service) => navigate(`/admin/catalog/services/${service.id}`)}
        onDelete={handleDelete}
        onDuplicate={async (service) => {
          try {
            const { id, createdAt, updatedAt, ...rest } = service;
            await createService(storeId, {
              ...rest,
              name: `${service.name} (Copy)`,
            });
            toast.success("Service duplicated");
            await loadServices();
          } catch (error) {
            toast.error(`Failed to duplicate service: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }}
      />
    </div>
  );
}
