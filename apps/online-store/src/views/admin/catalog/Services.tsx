'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { CatalogTable, Column } from "@/components/admin/catalog/CatalogTable";
import { SearchFilter } from "@/components/admin/catalog/SearchFilter";
import { BulkActions } from "@/components/admin/catalog/BulkActions";
import { Service } from "@/types/catalog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { getServices, getCategories, deleteService, createService, updateService, bulkDeleteServices } from "@/lib/services/catalogSyncService";
import type { Category } from "@/lib/adapters/catalogAdapters";
import { useStoreContext } from "@/hooks/useStoreContext";

export default function Services() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [filterValue, setFilterValue] = useState("all");
  const [sortValue, setSortValue] = useState("name");
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { storeId, tenantId } = useStoreContext();

  const loadServices = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const loadedServices = await getServices(storeId);
      setServices(loadedServices);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load services';
      setError(message);
      toast.error(message);
      setServices([]);
    } finally {
      setIsLoading(false);
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
  }, [storeId]);

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
      setServices((prev) => prev.filter((s) => s.id !== service.id));
      toast.success("Service deleted");
    } catch (error) {
      toast.error(`Failed to delete service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleBulkDelete = async () => {
    const count = selectedItems.length;
    try {
      await bulkDeleteServices(selectedItems);
      setServices((prev) => prev.filter((s) => !selectedItems.includes(s.id)));
      setSelectedItems([]);
      toast.success(`${count} services deleted`);
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
            <h1 className="text-3xl font-bold">Services</h1>
            <p className="text-muted-foreground">Manage your service catalog</p>
          </div>
        </div>
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-center">
          <p className="text-sm text-destructive mb-2">{error}</p>
          <Button variant="outline" size="sm" onClick={loadServices}>
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
        onEdit={(service) => router.push(`/admin/catalog/services/${service.id}`)}
        onDelete={handleDelete}
        onDuplicate={async (service) => {
          try {
            const { id, createdAt, updatedAt, ...rest } = service;
            await createService(storeId, tenantId, {
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
