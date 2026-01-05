import { cn } from '@/lib/utils';
import type { Package } from '@/data/mockPackages';

interface PackageGridProps {
  packages: Package[];
  onSelectPackage: (pkg: Package) => void;
  className?: string;
}

export function PackageGrid({ packages, onSelectPackage, className }: PackageGridProps) {
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4', className)}>
      {packages.map((pkg) => (
        <button
          key={pkg.id}
          onClick={() => onSelectPackage(pkg)}
          className={cn(
            'group rounded-2xl p-5 text-left transition-all duration-200 hover:shadow-lg hover:scale-[1.02]',
            pkg.gradient
          )}
        >
          {/* Discount Badge */}
          <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/80 text-xs font-semibold text-gray-700 mb-3">
            Save {pkg.discountPercent}%
          </div>

          {/* Package Name */}
          <h3 className="font-semibold text-gray-900 text-lg leading-tight mb-1">
            {pkg.name}
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-600 mb-3">{pkg.description}</p>

          {/* Included Services */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {pkg.includedServices.slice(0, 3).map((service, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/60 text-xs text-gray-600"
              >
                {service}
              </span>
            ))}
            {pkg.includedServices.length > 3 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/60 text-xs text-gray-500">
                +{pkg.includedServices.length - 3} more
              </span>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">${pkg.salePrice}</span>
            <span className="text-sm text-gray-500 line-through">${pkg.originalPrice}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

export default PackageGrid;
