import { useState } from 'react';
import { Wand2, Copy, ThumbsUp, ThumbsDown, RefreshCw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { aiCopywriter } from '@/lib/ai/copywriter';
import type { CopywritingRequest, CopywritingResult } from '@/lib/ai/copywriter';

const CopywriterPanel = () => {
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<CopywritingResult[]>([]);
  const [history, setHistory] = useState<CopywritingResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<CopywritingResult | null>(null);

  const [request, setRequest] = useState<CopywritingRequest>({
    type: 'headline',
    context: '',
    tone: 'professional',
    length: 'medium',
    businessName: 'Mango Salon',
    targetAudience: 'Beauty enthusiasts',
    additionalInfo: ''
  });

  const handleGenerate = async () => {
    if (!request.context.trim()) return;

    setIsGenerating(true);
    try {
      const generated = await aiCopywriter.generateMultipleOptions(request, 3);
      setResults(generated);
      setHistory(prev => [...generated, ...prev]);
    } catch (error) {
      console.error('Failed to generate copy:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleRate = (resultId: string, rating: number) => {
    setResults(prev => 
      prev.map(result => 
        result.id === resultId ? { ...result, rating } : result
      )
    );
    setHistory(prev => 
      prev.map(result => 
        result.id === resultId ? { ...result, rating } : result
      )
    );
  };

  const handleApply = (result: CopywritingResult) => {
    setSelectedResult(result);
    // In a real app, this would apply the copy to the actual content
    console.log('Applying copy:', result);
  };

  const copyTypes = [
    { value: 'headline', label: 'Headline' },
    { value: 'cta', label: 'Call-to-Action' },
    { value: 'promotion', label: 'Promotion' },
    { value: 'announcement', label: 'Announcement' },
    { value: 'service', label: 'Service Description' },
    { value: 'brand', label: 'Brand Message' }
  ];

  const tones = [
    { value: 'professional', label: 'Professional' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'casual', label: 'Casual' },
    { value: 'luxury', label: 'Luxury' }
  ];

  const lengths = [
    { value: 'short', label: 'Short (1-2 sentences)' },
    { value: 'medium', label: 'Medium (2-4 sentences)' },
    { value: 'long', label: 'Long (4-6 sentences)' }
  ];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Copywriter</h1>
        <p className="text-muted-foreground mt-1">
          Generate compelling copy for your salon with AI assistance
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList>
          <TabsTrigger value="generate">Generate Copy</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          {/* Generation Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                Generate New Copy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Copy Type</Label>
                  <Select
                    value={request.type}
                    onValueChange={(value) => setRequest(prev => ({ ...prev, type: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {copyTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tone">Tone</Label>
                  <Select
                    value={request.tone}
                    onValueChange={(value) => setRequest(prev => ({ ...prev, tone: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tones.map(tone => (
                        <SelectItem key={tone.value} value={tone.value}>
                          {tone.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="length">Length</Label>
                  <Select
                    value={request.length}
                    onValueChange={(value) => setRequest(prev => ({ ...prev, length: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {lengths.map(length => (
                        <SelectItem key={length.value} value={length.value}>
                          {length.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={request.businessName || ''}
                    onChange={(e) => setRequest(prev => ({ ...prev, businessName: e.target.value }))}
                    placeholder="Your salon name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="context">Context & Description</Label>
                <Textarea
                  id="context"
                  value={request.context}
                  onChange={(e) => setRequest(prev => ({ ...prev, context: e.target.value }))}
                  placeholder="Describe what you need copy for... (e.g., 'New summer nail art collection launching next week')"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="targetAudience">Target Audience</Label>
                  <Input
                    id="targetAudience"
                    value={request.targetAudience || ''}
                    onChange={(e) => setRequest(prev => ({ ...prev, targetAudience: e.target.value }))}
                    placeholder="e.g., Young professionals, Brides-to-be"
                  />
                </div>

                <div>
                  <Label htmlFor="additionalInfo">Additional Info</Label>
                  <Input
                    id="additionalInfo"
                    value={request.additionalInfo || ''}
                    onChange={(e) => setRequest(prev => ({ ...prev, additionalInfo: e.target.value }))}
                    placeholder="Any specific details or requirements"
                  />
                </div>
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !request.context.trim()}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Copy
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Generated Options</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Choose the best option or generate more variations
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {results.map((result, index) => (
                  <CopyResult
                    key={result.id}
                    result={result}
                    index={index + 1}
                    onCopy={handleCopy}
                    onRate={handleRate}
                    onApply={handleApply}
                  />
                ))}
                
                <Button 
                  variant="outline" 
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generate More Options
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generation History</CardTitle>
              <p className="text-sm text-muted-foreground">
                Your previously generated copy
              </p>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Wand2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No generated copy yet</p>
                  <p className="text-sm">Start generating copy to see your history here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((result, index) => (
                    <CopyResult
                      key={result.id}
                      result={result}
                      index={index + 1}
                      onCopy={handleCopy}
                      onRate={handleRate}
                      onApply={handleApply}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CopywriterPanel;

interface CopyResultProps {
  result: CopywritingResult;
  index: number;
  onCopy: (content: string) => void;
  onRate: (id: string, rating: number) => void;
  onApply: (result: CopywritingResult) => void;
}

const CopyResult = ({ result, index, onCopy, onRate, onApply }: CopyResultProps) => {
  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Option {index}</Badge>
            <Badge variant="outline">{result.tone}</Badge>
            <Badge variant="outline">{result.length}</Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRate(result.id, 1)}
              className={result.rating === 1 ? 'text-green-600' : ''}
            >
              <ThumbsUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRate(result.id, -1)}
              className={result.rating === -1 ? 'text-red-600' : ''}
            >
              <ThumbsDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <p className="text-sm mb-4 leading-relaxed">{result.content}</p>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCopy(result.content)}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button
            size="sm"
            onClick={() => onApply(result)}
          >
            <Save className="h-4 w-4 mr-2" />
            Apply
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
