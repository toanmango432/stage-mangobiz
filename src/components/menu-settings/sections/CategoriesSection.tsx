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
} from 'lucide-react';
import type { ServiceCategory, MenuService } from '../types';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../constants';
import { CategoryModal } from '../modals/CategoryModal';

interface CategoriesSectionProps {
  categories: ServiceCategory[];
  services: MenuService[];
  onUpdate: (categories: ServiceCategory[]) => void;
  searchQuery?: string;
}

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  Scissors, Paintbrush, Sparkles, Heart, Star, Gem,
  Flower2, Leaf, Sun, Moon, Droplet, Flame,
};

export function CategoriesSection({
  categories,
  services,
  onUpdate,
  searchQuery = '',
}: CategoriesSectionProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | undefined>();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [expandedMenuId, setExpandedMenuId] = useState<string | null>(null);

  // Filter categories by search
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get service count for category
  const getServiceCount = (categoryId: string) => {
    return services.filter(s => s.categoryId === categoryId).length;
  };

  // Handle add/edit category
  const handleSaveCategory = (categoryData: Partial<ServiceCategory>) => {
    if (editingCategory) {
      // Update existing
      const updated = categories.map(cat =>
        cat.id === editingCategory.id
          ? { ...cat, ...categoryData, updatedAt: new Date() }
          : cat
      );
      onUpdate(updated);
    } else {
      // Add new
      const newCategory: ServiceCategory = {
        id: `cat-${Date.now()}`,
        name: categoryData.name || 'New Category',
        description: categoryData.description,
        color: categoryData.color || CATEGORY_COLORS[0].value,
        icon: categoryData.icon || 'Sparkles',
        displayOrder: categories.length + 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      onUpdate([...categories, newCategory]);
    }
    setShowModal(false);
    setEditingCategory(undefined);
  };

  // Handle delete category
  const handleDelete = (categoryId: string) => {
    const serviceCount = getServiceCount(categoryId);
    if (serviceCount > 0) {
      alert(`Cannot delete category with ${serviceCount} services. Please move or delete services first.`);
      return;
    }
    if (confirm('Are you sure you want to delete this category?')) {
      onUpdate(categories.filter(cat => cat.id !== categoryId));
    }
  };

  // Handle toggle active
  const handleToggleActive = (categoryId: string) => {
    const updated = categories.map(cat =>
      cat.id === categoryId
        ? { ...cat, isActive: !cat.isActive, updatedAt: new Date() }
        : cat
    );
    onUpdate(updated);
  };

  // Handle duplicate
  const handleDuplicate = (category: ServiceCategory) => {
    const newCategory: ServiceCategory = {
      ...category,
      id: `cat-${Date.now()}`,
      name: `${category.name} (Copy)`,
      displayOrder: categories.length + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    onUpdate([...categories, newCategory]);
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

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const draggedIndex = categories.findIndex(c => c.id === draggedId);
    const targetIndex = categories.findIndex(c => c.id === targetId);

    const newCategories = [...categories];
    const [removed] = newCategories.splice(draggedIndex, 1);
    newCategories.splice(targetIndex, 0, removed);

    // Update display order
    const reordered = newCategories.map((cat, index) => ({
      ...cat,
      displayOrder: index + 1,
    }));

    onUpdate(reordered);
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
          {filteredCategories.map((category) => {
            const Icon = getIconComponent(category.icon || 'Sparkles');
            const serviceCount = getServiceCount(category.id);
            const colorObj = CATEGORY_COLORS.find(c => c.value === category.color);

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
                              handleDelete(category.id);
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

          {/* Empty State */}
          {filteredCategories.length === 0 && (
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
    </div>
  );
}
