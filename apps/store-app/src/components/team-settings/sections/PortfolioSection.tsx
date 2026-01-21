/**
 * PortfolioSection Component - Phase 4: Staff Experience
 *
 * Displays staff portfolio gallery with work samples.
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Image,
  Plus,
  Trash2,
  Star,
  Edit2,
  X,
  Grid3X3,
  List,
  Search,
  Tag,
  Heart,
  Upload,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Card, SectionHeader, Badge } from '../components/SharedComponents';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchPortfolioByStaff,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  togglePortfolioFeatured,
  selectPortfolioByStaff,
  selectPortfolioLoading,
  selectPortfolioError,
} from '@/store/slices/portfolioSlice';
import type { PortfolioItem } from '@/types/performance';

// ============================================
// TYPES
// ============================================

interface PortfolioSectionProps {
  memberId: string;
  memberName: string;
  storeId: string;
}

type ViewMode = 'grid' | 'list';


// ============================================
// PORTFOLIO ITEM CARD
// ============================================

interface PortfolioItemCardProps {
  item: PortfolioItem;
  viewMode: ViewMode;
  onEdit: (item: PortfolioItem) => void;
  onDelete: (itemId: string) => void;
  onToggleFeatured: (itemId: string) => void;
}

const PortfolioItemCard: React.FC<PortfolioItemCardProps> = ({
  item,
  viewMode,
  onEdit,
  onDelete,
  onToggleFeatured,
}) => {
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  if (viewMode === 'list') {
    return (
      <Card className="mb-3">
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={showBeforeAfter && item.beforeImageUrl ? item.beforeImageUrl : item.imageUrl}
              alt={item.title || 'Portfolio item'}
              className="w-full h-full object-cover"
            />
            {item.isBeforeAfter && (
              <button
                onClick={() => setShowBeforeAfter(!showBeforeAfter)}
                className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded"
              >
                {showBeforeAfter ? 'After' : 'Before'}
              </button>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-gray-900 truncate">{item.title || 'Untitled'}</h4>
              {item.isFeatured && (
                <Star className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0" />
              )}
            </div>
            {item.description && (
              <p className="text-sm text-gray-500 truncate">{item.description}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              {item.serviceName && (
                <Badge variant="info" size="sm">{item.serviceName}</Badge>
              )}
              {item.likes !== undefined && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Heart className="w-3 h-3" />
                  {item.likes}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFeatured(item.id)}
              className={`p-2 rounded-lg transition-colors ${
                item.isFeatured
                  ? 'text-amber-500 hover:bg-amber-50'
                  : 'text-gray-400 hover:bg-gray-100'
              }`}
            >
              <Star className={`w-4 h-4 ${item.isFeatured ? 'fill-amber-500' : ''}`} />
            </button>
            <button
              onClick={() => onEdit(item)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>
    );
  }

  // Grid view
  return (
    <div
      className="relative rounded-xl overflow-hidden group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="aspect-square">
        <img
          src={showBeforeAfter && item.beforeImageUrl ? item.beforeImageUrl : item.imageUrl}
          alt={item.title || 'Portfolio item'}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-200 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h4 className="text-white font-medium truncate">{item.title || 'Untitled'}</h4>
          {item.serviceName && (
            <p className="text-white/70 text-sm truncate">{item.serviceName}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            {item.likes !== undefined && (
              <span className="flex items-center gap-1 text-white/70 text-xs">
                <Heart className="w-3 h-3" />
                {item.likes}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFeatured(item.id);
            }}
            className={`p-1.5 rounded-lg backdrop-blur-sm transition-colors ${
              item.isFeatured
                ? 'bg-amber-500/80 text-white'
                : 'bg-white/20 text-white hover:bg-white/40'
            }`}
          >
            <Star className={`w-4 h-4 ${item.isFeatured ? 'fill-white' : ''}`} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
            className="p-1.5 bg-white/20 text-white rounded-lg backdrop-blur-sm hover:bg-white/40"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            className="p-1.5 bg-red-500/80 text-white rounded-lg backdrop-blur-sm hover:bg-red-500"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Before/After toggle */}
      {item.isBeforeAfter && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowBeforeAfter(!showBeforeAfter);
          }}
          className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-lg backdrop-blur-sm"
        >
          {showBeforeAfter ? 'Before' : 'After'}
        </button>
      )}

      {/* Featured badge */}
      {item.isFeatured && !isHovered && (
        <div className="absolute top-2 right-2">
          <Star className="w-5 h-5 text-amber-500 fill-amber-500 drop-shadow-lg" />
        </div>
      )}
    </div>
  );
};

// ============================================
// ADD/EDIT MODAL
// ============================================

interface PortfolioModalProps {
  item?: PortfolioItem;
  staffId: string;
  storeId: string;
  onClose: () => void;
  onSave: (item: Partial<PortfolioItem> & { imageUrl: string }) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const PortfolioModal: React.FC<PortfolioModalProps> = ({ item, staffId, storeId, onClose, onSave }) => {
  const isEditing = !!item;
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(item?.imageUrl || null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [title, setTitle] = useState(item?.title || '');
  const [description, setDescription] = useState(item?.description || '');
  const [tags, setTags] = useState(item?.tags?.join(', ') || '');

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('Please select a valid image file (JPEG, PNG, WebP, or GIF)');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    setUploadError(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  }, [title]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('Please select a valid image file (JPEG, PNG, WebP, or GIF)');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    setUploadError(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  }, [title]);

  const handleSubmit = async () => {
    if (!selectedFile && !isEditing) {
      setUploadError('Please select an image to upload');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      let imageUrl = item?.imageUrl || '';

      if (selectedFile) {
        // Import portfolioStorage dynamically to avoid circular dependencies
        const { portfolioStorage } = await import('@/services/supabase/storage/portfolioStorage');
        imageUrl = await portfolioStorage.uploadPortfolioImage(staffId, selectedFile);
      }

      const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);

      onSave({
        staffId,
        storeId,
        imageUrl,
        title: title || undefined,
        description: description || undefined,
        tags: tagsArray,
        isFeatured: item?.isFeatured || false,
        isBeforeAfter: item?.isBeforeAfter || false,
      });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {isEditing ? 'Edit Portfolio Item' : 'Add Portfolio Item'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Upload area */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className={`border-2 border-dashed rounded-xl p-8 text-center mb-6 cursor-pointer transition-colors ${
              previewUrl
                ? 'border-emerald-300 bg-emerald-50'
                : 'border-gray-300 hover:border-emerald-400 hover:bg-gray-50'
            }`}
          >
            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-48 mx-auto rounded-lg object-cover"
                />
                <p className="text-sm text-emerald-600 mt-2">Click to change image</p>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-1">Drag & drop images here</p>
                <p className="text-sm text-gray-400">or click to browse (max 5MB)</p>
              </>
            )}
          </div>

          {/* Error message */}
          {uploadError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {uploadError}
            </div>
          )}

          {/* Form fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                placeholder="Enter title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                placeholder="Describe this work..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <input
                type="text"
                placeholder="Add tags (comma separated)..."
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={uploading || (!selectedFile && !isEditing)}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
            {uploading ? 'Uploading...' : isEditing ? 'Save Changes' : 'Add to Portfolio'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN PORTFOLIO SECTION
// ============================================

export const PortfolioSection: React.FC<PortfolioSectionProps> = ({
  memberId,
  memberName,
  storeId,
}) => {
  const dispatch = useAppDispatch();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | undefined>();

  // Redux state
  const portfolio = useAppSelector((state) => selectPortfolioByStaff(state, memberId));
  const loading = useAppSelector(selectPortfolioLoading);
  const error = useAppSelector(selectPortfolioError);

  // Fetch portfolio on mount
  useEffect(() => {
    if (memberId) {
      dispatch(fetchPortfolioByStaff(memberId));
    }
  }, [dispatch, memberId]);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    portfolio.forEach((item) => item.tags.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [portfolio]);

  // Filter portfolio
  const filteredPortfolio = useMemo(() => {
    let filtered = [...portfolio];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title?.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    if (filterTag) {
      filtered = filtered.filter((item) => item.tags.includes(filterTag));
    }

    if (showFeaturedOnly) {
      filtered = filtered.filter((item) => item.isFeatured);
    }

    return filtered;
  }, [portfolio, searchQuery, filterTag, showFeaturedOnly]);

  // Stats
  const stats = useMemo(() => {
    const totalItems = portfolio.length;
    const featuredItems = portfolio.filter((p) => p.isFeatured).length;
    const totalLikes = portfolio.reduce((sum, p) => sum + (p.likes || 0), 0);
    return { totalItems, featuredItems, totalLikes };
  }, [portfolio]);

  // Handlers
  const handleEdit = useCallback((item: PortfolioItem) => {
    setEditingItem(item);
    setShowModal(true);
  }, []);

  const handleDelete = useCallback((itemId: string) => {
    dispatch(deletePortfolioItem(itemId));
  }, [dispatch]);

  const handleToggleFeatured = useCallback((itemId: string) => {
    dispatch(togglePortfolioFeatured(itemId));
  }, [dispatch]);

  const handleSave = useCallback((item: Partial<PortfolioItem> & { imageUrl: string }) => {
    if (editingItem) {
      // Update existing item
      dispatch(updatePortfolioItem({
        id: editingItem.id,
        changes: item,
      }));
    } else {
      // Create new item
      dispatch(createPortfolioItem({
        staffId: memberId,
        storeId,
        imageUrl: item.imageUrl,
        title: item.title,
        description: item.description,
        tags: item.tags || [],
        isFeatured: item.isFeatured || false,
        isBeforeAfter: item.isBeforeAfter || false,
      }));
    }
    setShowModal(false);
    setEditingItem(undefined);
  }, [dispatch, editingItem, memberId, storeId]);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setEditingItem(undefined);
  }, []);

  const handleAddNew = useCallback(() => {
    setEditingItem(undefined);
    setShowModal(true);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <SectionHeader
        title="Portfolio"
        subtitle={`Showcase ${memberName}'s best work`}
        icon={<Image className="w-5 h-5" />}
        action={
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Work
          </button>
        }
      />

      {/* Loading state */}
      {loading && (
        <Card>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            <span className="ml-3 text-gray-500">Loading portfolio...</span>
          </div>
        </Card>
      )}

      {/* Error state */}
      {error && !loading && (
        <Card>
          <div className="flex items-center justify-center py-8 text-red-500">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
        </Card>
      )}

      {/* Stats */}
      {!loading && !error && (
      <>
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <div className="flex items-center justify-center gap-2">
            <Image className="w-5 h-5 text-emerald-500" />
            <span className="text-2xl font-bold text-gray-900">{stats.totalItems}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Portfolio Items</p>
        </Card>
        <Card className="text-center">
          <div className="flex items-center justify-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            <span className="text-2xl font-bold text-gray-900">{stats.featuredItems}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Featured</p>
        </Card>
        <Card className="text-center">
          <div className="flex items-center justify-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            <span className="text-2xl font-bold text-gray-900">{stats.totalLikes}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Total Likes</p>
        </Card>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search portfolio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        {/* Tag filter */}
        <div className="relative">
          <select
            value={filterTag || ''}
            onChange={(e) => setFilterTag(e.target.value || null)}
            className="pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm appearance-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="">All Tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>

        {/* Featured toggle */}
        <button
          onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
            showFeaturedOnly
              ? 'bg-amber-50 border-amber-200 text-amber-700'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Star className={`w-4 h-4 ${showFeaturedOnly ? 'fill-amber-500' : ''}`} />
          Featured
        </button>

        {/* View mode toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'grid'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Portfolio Grid/List */}
      {filteredPortfolio.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredPortfolio.map((item) => (
              <PortfolioItemCard
                key={item.id}
                item={item}
                viewMode={viewMode}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleFeatured={handleToggleFeatured}
              />
            ))}
          </div>
        ) : (
          <div>
            {filteredPortfolio.map((item) => (
              <PortfolioItemCard
                key={item.id}
                item={item}
                viewMode={viewMode}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleFeatured={handleToggleFeatured}
              />
            ))}
          </div>
        )
      ) : (
        <Card>
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No portfolio items found</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchQuery || filterTag
                ? 'Try adjusting your filters'
                : 'Add work samples to showcase your skills'}
            </p>
            {!searchQuery && !filterTag && (
              <button
                onClick={handleAddNew}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-emerald-600 hover:text-emerald-700 font-medium"
              >
                <Plus className="w-4 h-4" />
                Add your first work sample
              </button>
            )}
          </div>
        </Card>
      )}
      </>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <PortfolioModal
          item={editingItem}
          staffId={memberId}
          storeId={storeId}
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default PortfolioSection;
