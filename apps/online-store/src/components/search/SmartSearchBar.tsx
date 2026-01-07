import { useState, useEffect, useRef } from "react";
import { Search, Sparkles, Clock, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getSmartSearchSuggestions } from "@/lib/ai/smartSearch";
import { getServices, getProducts } from "@/lib/api/store";
import { usePersonalization } from "@/hooks/usePersonalization";

interface SmartSearchBarProps {
  placeholder?: string;
  onSelect?: (result: any) => void;
  type?: 'all' | 'services' | 'products';
}

export function SmartSearchBar({ 
  placeholder = "Search services and products...", 
  onSelect,
  type = 'all'
}: SmartSearchBarProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { trackSearch } = usePersonalization();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const fetchSuggestions = async () => {
      const services = type !== 'products' ? await getServices() : [];
      const products = type !== 'services' ? await getProducts() : [];
      
      const results = getSmartSearchSuggestions(query, services as any, products as any);
      setSuggestions(results);
      setIsOpen(results.length > 0);
    };
    
    fetchSuggestions();
  }, [query, type]);

  const handleSelect = (suggestion: any) => {
    if (suggestion.result) {
      onSelect?.(suggestion.result);
      trackSearch(query);
    }
    setQuery("");
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions[selectedIndex]) {
        handleSelect(suggestions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setSuggestions.length > 0 && setIsOpen(true)}
          className="pl-10 pr-10"
        />
        {query && (
          <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-500 animate-pulse" />
        )}
      </div>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 w-full bg-background border rounded-lg shadow-lg z-50 max-h-96 overflow-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSelect(suggestion)}
                className={cn(
                  "w-full px-4 py-3 text-left hover:bg-accent transition-colors",
                  "flex items-center gap-3 border-b last:border-b-0",
                  selectedIndex === index && "bg-accent"
                )}
              >
                {suggestion.type === 'time' ? (
                  <Clock className="h-4 w-4 text-purple-500 flex-shrink-0" />
                ) : suggestion.type === 'product' ? (
                  <Package className="h-4 w-4 text-blue-500 flex-shrink-0" />
                ) : (
                  <Sparkles className="h-4 w-4 text-purple-500 flex-shrink-0" />
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{suggestion.query}</p>
                  {suggestion.result && (
                    <p className="text-xs text-muted-foreground truncate">
                      {suggestion.result.category || suggestion.result.type}
                      {suggestion.result.basePrice && ` • $${suggestion.result.basePrice}`}
                      {suggestion.result.retailPrice && ` • $${suggestion.result.retailPrice}`}
                    </p>
                  )}
                </div>
                
                <span className="text-xs text-muted-foreground">
                  {Math.round(suggestion.confidence * 100)}% match
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
