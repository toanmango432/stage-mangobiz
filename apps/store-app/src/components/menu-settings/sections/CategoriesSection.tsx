import React, { useState } from 'react';
import {
  Plus,
  GripVertical,
  Edit3,
  Trash2,
  ChevronRight,
  MoreVertical,
  Scissors,
  Paintbrush,
  Sparkles,
  Heart,
  Star,
  Gem,
  Flower2,
  Leaf,
  Sun,
  Moon,
  Droplet,
  Flame,
  EyeOff,
  Eye,
  Copy,
  AlertTriangle,
} from 'lucide-react';
import type {
  ServiceCategory,
  MenuServiceWithEmbeddedVariants,
  CategoryWithCount,
} from '@/types/catalog';
import { CATEGORY_COLORS } from '../constants';
import { CategoryModal } from '../modals/CategoryModal';
import { ConfirmDialog, CategoryCardSkeleton } from '../components';

interface CategoriesSectionProps {
  categories: CategoryWithCount[];
  services: MenuServiceWithEmbeddedVariants[];
  searchQuery?: string;
  /** Loading state - shows skeleton cards when true */
  isLoading?: boolean;
  // Action callbacks (return types are flexible to match useCatalog hook)
  onCreate?: (data: Partial<ServiceCategory>) => Promise<ServiceCategory | null | undefined>;
  onUpdate?: (id: string, data: Partial<ServiceCategory>) => Promise<ServiceCategory | null | undefined>;
  onDelete?: (id: string) => Promise<boolean | null | undefined>;
  onReorder?: (orderedIds: string[]) => Promise<void | null>;
}

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  Scissors, Paintbrush, Sparkles, Heart, Star, Gem,
  Flower2, Leaf, Sun, Moon, Droplet, Flame,
};

export function CategoriesSection({
  categories,
  services,
  searchQuery = '',
  isLoading = false,
  onCreate,
  onUpdate,
  onDelete,
  onReorder,
}: CategoriesSectionProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | undefined>();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [expandedMenuId, setExpandedMenuId] = useState<string | null>(null);

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategoryToDelete, setSelectedCategoryToDelete] = useState<CategoryWithCount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Error dialog state (for non-deletable categories)
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Filter categories by search
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get service count for category (using the pre-computed count from CategoryWithCount)
  const getServiceCount = (category: CategoryWithCount) => {
    return category.servicesCount || services.filter(s => s.categoryId === category.id).length;
  };

  // Handle add/edit category
  const handleSaveCategory = async (categoryData: Partial<ServiceCategory>) => {
    if (editingCategory) {
      // Update existing
      if (onUpdate) {
        await onUpdate(editingCategory.id, categoryData);
      }
    } else {
      // Create new
      if (onCreate) {
        await onCreate({
          name: categoryData.name || 'New Category',
          description: categoryData.description,
          color: categoryData.color || CATEGORY_COLORS[0].value,
          icon: categoryData.icon || 'Sparkles',
          displayOrder: categories.length + 1,
          isActive: true,
        });
      }
    }
    setShowModal(false);
    setEditingCategory(undefined);
  };

  // Handle delete category - opens confirmation dialog
  const handleDeleteClick = (category: CategoryWithCount) => {
    const serviceCount = getServiceCount(category);
    if (serviceCount > 0) {
      // Show error dialog if category has services
      setErrorMessage(`Cannot delete category with ${serviceCount} service${serviceCount > 1 ? 's' : ''}. Please move or delete services first.`);
      setErrorDialogOpen(true);
      return;
    }
    // Show delete confirmation dialog
    setSelectedCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  // Confirm delete action
  const handleConfirmDelete = async () => {
    if (!selectedCategoryToDelete || !onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(selectedCategoryToDelete.id);
      setDeleteDialogOpen(false);
      setSelectedCategoryToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle toggle active
  const handleToggleActive = async (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (category && onUpdate) {
      await onUpdate(categoryId, { isActive: !category.isActive });
    }
  };

  // Handle duplicate
  const handleDuplicate = async (category: ServiceCategory) => {
    if (onCreate) {
      await onCreate({
        name: `${category.name} (Copy)`,
        description: category.description,
        color: category.color,
        icon: category.icon,
        displayOrder: categories.length + 1,
        isActive: true,
      });
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, categoryId: string) => {
    setDraggedId(categoryId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const draggedIndex = categories.findIndex(c => c.id === draggedId);
    const targetIndex = categories.findIndex(c => c.id === targetId);

    const newCategories = [...categories];
    const [removed] = newCategories.splice(draggedIndex, 1);
    newCategories.splice(targetIndex, 0, removed);

    // Get the new ordered IDs and call onReorder
    const orderedIds = newCategories.map(cat => cat.id);
    if (onReorder) {
      await onReorder(orderedIds);
    }
    setDraggedId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  // Get icon component
  const getIconComponent = (iconName: string) => {
    const Icon = iconMap[iconName] || Sparkles;
    return Icon;
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Service Categories</h2>
            <p className="text-sm text-gray-500 mt-1">
              Organize your services into categories. Drag to reorder.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingCategory(undefined);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
          >
            <Plus size={18} />
            Add Category
          </button>
        </div>

        {/* Categories List */}
        <div className="space-y-2">
          {/* Loading State - Show skeletons */}
          {isLoading && (
            <>
              {Array.from({ length: 5 }).map((_, index) => (
                <CategoryCardSkeleton key={`skeleton-${index}`} />
              ))}
            </>
          )}

          {/* Loaded State - Show actual categories */}
          {!isLoading && filteredCategories.map((category) => {
            const Icon = getIconComponent(category.icon || 'Sparkles');
            const serviceCount = getServiceCount(category);

            return (
              <div
                key={category.id}
                draggable
                onDragStart={(e) => handleDragStart(e, category.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, category.id)}
                onDragEnd={handleDragEnd}
                className={`bg-white rounded-xl border border-gray-200 p-4 transition-all ${
                  draggedId === category.id ? 'opacity-50 scale-[0.98]' : ''
                } ${!category.isActive ? 'opacity-60' : ''} hover:shadow-md group`}
              >
                <div className="flex items-center gap-4">
                  {/* Drag Handle */}
                  <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
                    <GripVertical size={20} />
                  </div>

                  {/* Color Icon */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${category.color}15` }}
                  >
                    <Icon size={24} style={{ color: category.color }} />
                  </div>

                  {/* Category Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{category.name}</h3>
                      {!category.isActive && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    {category.description && (
                      <p className="text-sm text-gray-500 mt-0.5 truncate">
                        {category.description}
                      </p>
                    )}
                  </div>

                  {/* Service Count */}
                  <div className="text-center px-4">
                    <p className="text-lg font-semibold text-gray-900">{serviceCount}</p>
                    <p className="text-xs text-gray-500">services</p>
                  </div>

                  {/* Color Badge */}
                  <div
                    className="w-6 h-6 rounded-full flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                  />

                  {/* Actions */}
                  <div className="relative">
                    <button
                      onClick={() => setExpandedMenuId(expandedMenuId === category.id ? null : category.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <MoreVertical size={18} />
                    </button>

                    {/* Dropdown Menu */}
                    {expandedMenuId === category.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setExpandedMenuId(null)}
                        />
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                          <button
                            onClick={() => {
                              setEditingCategory(category);
                              setShowModal(true);
                              setExpandedMenuId(null);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Edit3 size={16} />
                            Edit Category
                          </button>
                          <button
                            onClick={() => {
                              handleDuplicate(category);
                              setExpandedMenuId(null);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Copy size={16} />
                            Duplicate
                          </button>
                          <button
                            onClick={() => {
                              handleToggleActive(category.id);
                              setExpandedMenuId(null);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            {category.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                            {category.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <hr className="my-1" />
                          <button
                            onClick={() => {
                              handleDeleteClick(category);
                              setExpandedMenuId(null);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  <ChevronRight size={18} className="text-gray-400" />
                </div>
              </div>
            );
          })}

          {/* Empty State - Only show when not loading */}
          {!isLoading && filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles size={24} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery
                  ? 'Try adjusting your search'
                  : 'Get started by creating your first category'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  <Plus size={18} />
                  Add Category
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Category Modal */}
      <CategoryModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingCategory(undefined);
        }}
        category={editingCategory}
        onSave={handleSaveCategory}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setSelectedCategoryToDelete(null);
          }
        }}
        title="Delete Category"
        description={`Are you sure you want to delete "${selectedCategoryToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        icon={<Trash2 className="h-5 w-5 text-red-500" />}
      />

      {/* Error Dialog (for categories with services) */}
      <ConfirmDialog
        open={errorDialogOpen}
        onOpenChange={setErrorDialogOpen}
        title="Cannot Delete Category"
        description={errorMessage}
        confirmLabel="OK"
        variant="default"
        onConfirm={() => setErrorDialogOpen(false)}
        icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
      />
    </div>
  );
}
