import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
} from "@/components/ui/responsive-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Search, Tag, Clock, Check, Sparkles, PackageX } from "lucide-react";

interface StaffMember {
  id: string;
  name: string;
  color?: string;
  available?: boolean;
}

interface ServicePackage {
  id: string;
  name: string;
  description: string;
  services: {
    serviceId: string;
    serviceName: string;
    originalPrice: number;
  }[];
  packagePrice: number;
  validDays: number;
  category: string;
}

interface ServicePackagesProps {
  onSelectPackage: (packageData: ServicePackage, staffId: string) => void;
  staffMembers: StaffMember[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MOCK_PACKAGES: ServicePackage[] = [
  {
    id: "pkg-1",
    name: "Luxury Spa Day",
    description: "Full relaxation package with massage, facial, and mani-pedi",
    services: [
      { serviceId: "svc-1", serviceName: "Deep Tissue Massage (60 min)", originalPrice: 120 },
      { serviceId: "svc-2", serviceName: "Hydrating Facial", originalPrice: 95 },
      { serviceId: "svc-3", serviceName: "Classic Manicure", originalPrice: 35 },
      { serviceId: "svc-4", serviceName: "Classic Pedicure", originalPrice: 45 },
    ],
    packagePrice: 249,
    validDays: 90,
    category: "Spa",
  },
  {
    id: "pkg-2",
    name: "Bridal Beauty",
    description: "Complete bridal preparation package",
    services: [
      { serviceId: "svc-5", serviceName: "Hair Styling & Updo", originalPrice: 150 },
      { serviceId: "svc-6", serviceName: "Full Makeup Application", originalPrice: 120 },
      { serviceId: "svc-7", serviceName: "Gel Manicure", originalPrice: 55 },
      { serviceId: "svc-8", serviceName: "Gel Pedicure", originalPrice: 65 },
    ],
    packagePrice: 325,
    validDays: 30,
    category: "Special Occasion",
  },
  {
    id: "pkg-3",
    name: "Monthly Maintenance",
    description: "Keep your look fresh with monthly essentials",
    services: [
      { serviceId: "svc-9", serviceName: "Haircut & Style", originalPrice: 65 },
      { serviceId: "svc-10", serviceName: "Eyebrow Shaping", originalPrice: 25 },
      { serviceId: "svc-11", serviceName: "Express Facial", originalPrice: 60 },
    ],
    packagePrice: 125,
    validDays: 45,
    category: "Hair & Beauty",
  },
  {
    id: "pkg-4",
    name: "Men's Grooming",
    description: "Complete men's grooming experience",
    services: [
      { serviceId: "svc-12", serviceName: "Men's Haircut", originalPrice: 45 },
      { serviceId: "svc-13", serviceName: "Beard Trim & Shape", originalPrice: 25 },
      { serviceId: "svc-14", serviceName: "Hot Towel Treatment", originalPrice: 20 },
    ],
    packagePrice: 75,
    validDays: 30,
    category: "Men's",
  },
  {
    id: "pkg-5",
    name: "Color & Care",
    description: "Full hair color service with treatment",
    services: [
      { serviceId: "svc-15", serviceName: "Full Color", originalPrice: 120 },
      { serviceId: "svc-16", serviceName: "Deep Conditioning Treatment", originalPrice: 45 },
      { serviceId: "svc-17", serviceName: "Blow Dry & Style", originalPrice: 40 },
    ],
    packagePrice: 175,
    validDays: 60,
    category: "Hair & Beauty",
  },
];

function PackageSkeletonCard() {
  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-full" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="text-right flex-shrink-0 space-y-1">
            <Skeleton className="h-3 w-12 ml-auto" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="py-3 sm:py-4 space-y-4 sm:space-y-6">
      <div>
        <Skeleton className="h-4 w-16 mb-2 sm:mb-3" />
        <div className="grid gap-2 sm:gap-3">
          <PackageSkeletonCard />
        </div>
      </div>
      <div>
        <Skeleton className="h-4 w-28 mb-2 sm:mb-3" />
        <div className="grid gap-2 sm:gap-3">
          <PackageSkeletonCard />
          <PackageSkeletonCard />
        </div>
      </div>
      <div>
        <Skeleton className="h-4 w-20 mb-2 sm:mb-3" />
        <div className="grid gap-2 sm:gap-3">
          <PackageSkeletonCard />
        </div>
      </div>
    </div>
  );
}

function EmptySearchState() {
  return (
    <div className="py-12 text-center text-muted-foreground" data-testid="empty-search-packages">
      <PackageX className="h-12 w-12 mx-auto mb-3 opacity-50" />
      <p>No packages found</p>
      <p className="text-sm">Try a different search term or category</p>
    </div>
  );
}

function EmptyPackagesState() {
  return (
    <div className="py-12 text-center text-muted-foreground" data-testid="empty-packages">
      <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
      <p>No packages available</p>
      <p className="text-sm">Check back later or contact support</p>
    </div>
  );
}


export default function ServicePackages({
  onSelectPackage,
  staffMembers,
  open,
  onOpenChange,
}: ServicePackagesProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [packages, setPackages] = useState<ServicePackage[]>([]);

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setPackages(MOCK_PACKAGES);
        setIsLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setPackages([]);
      setIsLoading(true);
    }
  }, [open]);

  const filteredPackages = packages.filter(
    (pkg) =>
      pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = Array.from(new Set(packages.map((pkg) => pkg.category)));

  const calculateSavings = (pkg: ServicePackage) => {
    const originalTotal = pkg.services.reduce((sum, s) => sum + s.originalPrice, 0);
    return originalTotal - pkg.packagePrice;
  };

  const calculateSavingsPercent = (pkg: ServicePackage) => {
    const originalTotal = pkg.services.reduce((sum, s) => sum + s.originalPrice, 0);
    return Math.round(((originalTotal - pkg.packagePrice) / originalTotal) * 100);
  };

  const handleSelectPackage = () => {
    if (selectedPackage && selectedStaffId) {
      onSelectPackage(selectedPackage, selectedStaffId);
      setSelectedPackage(null);
      setSelectedStaffId(null);
      onOpenChange(false);
    }
  };

  const handlePackageClick = (pkg: ServicePackage) => {
    setSelectedPackage(pkg);
    if (staffMembers.length === 1) {
      setSelectedStaffId(staffMembers[0].id);
    } else {
      setSelectedStaffId(null);
    }
  };

  const handleClose = () => {
    setSelectedPackage(null);
    setSelectedStaffId(null);
    setSearchQuery("");
    onOpenChange(false);
  };

  const renderContent = () => {
    if (isLoading) {
      return <LoadingState />;
    }

    if (packages.length === 0) {
      return <EmptyPackagesState />;
    }

    if (filteredPackages.length === 0) {
      return <EmptySearchState />;
    }

    return (
      <div className="py-3 sm:py-4 space-y-4 sm:space-y-6">
        {categories.map((category) => {
          const categoryPackages = filteredPackages.filter(
            (pkg) => pkg.category === category
          );
          if (categoryPackages.length === 0) return null;

          return (
            <div key={category}>
              <h3 className="text-sm font-medium text-muted-foreground mb-2 sm:mb-3">
                {category}
              </h3>
              <div className="grid gap-2 sm:gap-3">
                {categoryPackages.map((pkg) => (
                  <Card
                    key={pkg.id}
                    className="cursor-pointer hover-elevate active-elevate-2 transition-all"
                    onClick={() => handlePackageClick(pkg)}
                    data-testid={`card-package-${pkg.id}`}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start justify-between gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-medium truncate">{pkg.name}</h4>
                            <Badge
                              variant="secondary"
                              className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            >
                              Save {calculateSavingsPercent(pkg)}%
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2 sm:line-clamp-1">
                            {pkg.description}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Tag className="h-4 w-4" />
                              {pkg.services.length} services
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Valid {pkg.validDays} days
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xs text-muted-foreground line-through">
                            $
                            {pkg.services
                              .reduce((sum, s) => sum + s.originalPrice, 0)
                              .toFixed(2)}
                          </div>
                          <div className="text-lg font-bold">
                            ${pkg.packagePrice.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={handleClose}
      title={
        <>
          <Package className="h-5 w-5" />
          Service Packages
        </>
      }
      description="Select a package to add bundled services at a discounted price"
    >
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search packages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 sm:h-10"
            data-testid="input-search-packages"
            disabled={isLoading}
          />
        </div>
      </div>

      <ResponsiveDialogBody className="px-4 sm:px-6">
        {!selectedPackage ? (
          renderContent()
        ) : (
          <div className="py-3 sm:py-4 space-y-3 sm:space-y-4">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-base sm:text-lg">{selectedPackage.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedPackage.description}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/20 flex-shrink-0">
                    Save ${calculateSavings(selectedPackage).toFixed(2)}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Included Services
                  </h4>
                  {selectedPackage.services.map((service, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm py-1.5 px-2 sm:px-3 rounded bg-background"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <Check className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                        <span className="truncate">{service.serviceName}</span>
                      </span>
                      <span className="text-muted-foreground flex-shrink-0 ml-2">
                        ${service.originalPrice.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div>
                    <span className="text-sm text-muted-foreground">Package Price</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xl sm:text-2xl font-bold">
                        ${selectedPackage.packagePrice.toFixed(2)}
                      </span>
                      <span className="text-sm text-muted-foreground line-through">
                        $
                        {selectedPackage.services
                          .reduce((sum, s) => sum + s.originalPrice, 0)
                          .toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 inline mr-1" />
                    Valid for {selectedPackage.validDays} days
                  </div>
                </div>
              </CardContent>
            </Card>

            {staffMembers.length > 1 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Assign to Staff</h4>
                <div className="grid grid-cols-2 gap-2">
                  {staffMembers.map((staff) => (
                    <Button
                      key={staff.id}
                      variant={selectedStaffId === staff.id ? "default" : "outline"}
                      className="justify-start h-12"
                      onClick={() => setSelectedStaffId(staff.id)}
                      data-testid={`button-assign-staff-${staff.id}`}
                    >
                      <div
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-sm font-medium mr-2 flex-shrink-0"
                        style={{ backgroundColor: staff.color }}
                      >
                        {staff.name.charAt(0)}
                      </div>
                      <span className="truncate">{staff.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </ResponsiveDialogBody>

      <ResponsiveDialogFooter className="px-4 sm:px-6 py-3 sm:py-4 flex gap-2">
        {selectedPackage ? (
          <>
            <Button
              variant="outline"
              className="flex-1 h-12 sm:h-10"
              onClick={() => {
                setSelectedPackage(null);
                setSelectedStaffId(null);
              }}
              data-testid="button-back-packages"
            >
              Back
            </Button>
            <Button
              className="flex-1 h-12 sm:h-10"
              disabled={!selectedStaffId}
              onClick={handleSelectPackage}
              data-testid="button-add-package"
            >
              Add Package - ${selectedPackage.packagePrice.toFixed(2)}
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            className="w-full h-12 sm:h-10"
            onClick={handleClose}
            data-testid="button-close-packages"
          >
            Close
          </Button>
        )}
      </ResponsiveDialogFooter>
    </ResponsiveDialog>
  );
}
