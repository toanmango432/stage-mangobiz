'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Upload, Search, Grid3x3, List, Trash2, Copy, Eye } from "lucide-react";
import { toast } from "sonner";

interface MediaAsset {
  id: string;
  url: string;
  filename: string;
  size: string;
  dimensions: string;
  uploadedAt: string;
  altText: string;
  usedIn: string[];
}

const mockAssets: MediaAsset[] = [
  {
    id: "1",
    url: "/placeholder.svg",
    filename: "hero-salon.jpg",
    size: "2.3 MB",
    dimensions: "1920x1080",
    uploadedAt: "2024-01-15",
    altText: "Luxury salon interior",
    usedIn: ["Homepage Hero", "About Page"],
  },
  {
    id: "2",
    url: "/placeholder.svg",
    filename: "product-serum.jpg",
    size: "856 KB",
    dimensions: "800x800",
    uploadedAt: "2024-01-14",
    altText: "Anti-aging serum product",
    usedIn: ["Shop Page"],
  },
  {
    id: "3",
    url: "/placeholder.svg",
    filename: "gift-card.jpg",
    size: "1.1 MB",
    dimensions: "1200x800",
    uploadedAt: "2024-01-13",
    altText: "Gift card design",
    usedIn: ["Gift Cards Page"],
  },
];

const Media = () => {
  const [assets, setAssets] = useState<MediaAsset[]>(mockAssets);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);

  const filteredAssets = assets.filter((asset) =>
    asset.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpload = () => {
    toast.info("File upload coming soon - drag & drop supported");
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Image URL copied to clipboard");
  };

  const handleDelete = (id: string) => {
    const asset = assets.find((a) => a.id === id);
    if (asset && asset.usedIn.length > 0) {
      toast.error(`Cannot delete - used in ${asset.usedIn.join(", ")}`);
      return;
    }
    setAssets(assets.filter((a) => a.id !== id));
    toast.success("Asset deleted");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Media Library</h1>
          <p className="text-muted-foreground">
            Manage images, videos, and other assets for your store
          </p>
        </div>
        <Button onClick={handleUpload}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Files
        </Button>
      </div>

      {/* Search & View Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assets Grid/List */}
      <Card>
        <CardContent className="pt-6">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="group relative border rounded-lg overflow-hidden hover:border-primary transition-colors cursor-pointer"
                  onClick={() => setSelectedAsset(asset)}
                >
                  <div className="aspect-square bg-muted">
                    <img
                      src={asset.url}
                      alt={asset.altText}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium truncate">{asset.filename}</p>
                    <p className="text-xs text-muted-foreground">{asset.size}</p>
                  </div>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="icon" variant="secondary" onClick={() => handleCopyUrl(asset.url)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => handleDelete(asset.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:border-primary transition-colors"
                >
                  <img
                    src={asset.url}
                    alt={asset.altText}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{asset.filename}</p>
                    <p className="text-sm text-muted-foreground">
                      {asset.dimensions} • {asset.size} • Uploaded {asset.uploadedAt}
                    </p>
                    {asset.usedIn.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {asset.usedIn.map((usage) => (
                          <Badge key={usage} variant="secondary" className="text-xs">
                            {usage}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="outline" onClick={() => handleCopyUrl(asset.url)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleDelete(asset.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Asset Details Modal could go here */}
    </div>
  );
};

export default Media;
