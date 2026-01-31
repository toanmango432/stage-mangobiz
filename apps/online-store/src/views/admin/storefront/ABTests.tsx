'use client';

import { useState, useEffect } from 'react';
import { Plus, Play, Pause, BarChart3, Settings, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExperimentCard } from '@/components/admin/ab-testing/ExperimentCard';
import { ExperimentForm } from '@/components/admin/ab-testing/ExperimentForm';
import TestResults from '@/components/admin/ab-testing/TestResults';
import { experimentManager } from '@/lib/ab-testing/experiment';
import type { ABTestExperiment, TestStatus } from '@/types/ab-test';

export default function ABTests() {
  const [experiments, setExperiments] = useState<ABTestExperiment[]>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<ABTestExperiment | null>(null);
  const [activeTab, setActiveTab] = useState<'experiments' | 'create' | 'results'>('experiments');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadExperiments();
  }, []);

  const loadExperiments = () => {
    const allExperiments = experimentManager.getAllExperiments();
    setExperiments(allExperiments);
  };

  const handleCreateExperiment = (experimentData: Omit<ABTestExperiment, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = experimentManager.createExperiment(experimentData);
    if (id) {
      loadExperiments();
      setIsCreating(false);
      setActiveTab('experiments');
    }
  };

  const handleUpdateExperiment = (id: string, updates: Partial<ABTestExperiment>) => {
    if (experimentManager.updateExperiment(id, updates)) {
      loadExperiments();
      if (selectedExperiment?.id === id) {
        setSelectedExperiment({ ...selectedExperiment, ...updates });
      }
    }
  };

  const handleDeleteExperiment = (id: string) => {
    if (experimentManager.deleteExperiment(id)) {
      loadExperiments();
      if (selectedExperiment?.id === id) {
        setSelectedExperiment(null);
      }
    }
  };

  const handleStatusChange = (id: string, status: TestStatus) => {
    let success = false;
    
    switch (status) {
      case 'running':
        success = experimentManager.startExperiment(id);
        break;
      case 'paused':
        success = experimentManager.pauseExperiment(id);
        break;
      case 'completed':
        success = experimentManager.completeExperiment(id);
        break;
    }

    if (success) {
      loadExperiments();
    }
  };

  const getStatusColor = (status: TestStatus) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'running': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const runningExperiments = experiments.filter(exp => exp.status === 'running');
  const completedExperiments = experiments.filter(exp => exp.status === 'completed');

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">A/B Testing</h1>
          <p className="text-muted-foreground mt-1">
            Test different versions of your content to optimize performance
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setActiveTab('results')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            View Results
          </Button>
          <Button
            onClick={() => {
              setIsCreating(true);
              setActiveTab('create');
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Test
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Settings className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Tests</p>
                <p className="text-2xl font-bold">{experiments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Play className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Running</p>
                <p className="text-2xl font-bold">{runningExperiments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedExperiments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Pause className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Paused</p>
                <p className="text-2xl font-bold">
                  {experiments.filter(exp => exp.status === 'paused').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList>
          <TabsTrigger value="experiments">All Tests</TabsTrigger>
          <TabsTrigger value="create">Create Test</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="experiments" className="space-y-4">
          {experiments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-4xl mb-4">🧪</div>
                <h3 className="text-lg font-semibold mb-2">No A/B tests yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first A/B test to start optimizing your content
                </p>
                <Button onClick={() => {
                  setIsCreating(true);
                  setActiveTab('create');
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Test
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {experiments.map((experiment) => (
                <ExperimentCard
                  key={experiment.id}
                  experiment={experiment}
                  onStart={() => handleStatusChange(experiment.id, 'running')}
                  onPause={() => handleStatusChange(experiment.id, 'paused')}
                  onComplete={() => handleStatusChange(experiment.id, 'completed')}
                  onEdit={() => {
                    setSelectedExperiment(experiment);
                    setActiveTab('create');
                  }}
                  onDelete={() => handleDeleteExperiment(experiment.id)}
                  onViewResults={() => {
                    setSelectedExperiment(experiment);
                    setActiveTab('results');
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="create">
          <ExperimentForm
            experiment={selectedExperiment || undefined}
            onSave={handleCreateExperiment}
            onCancel={() => {
              setIsCreating(false);
              setSelectedExperiment(null);
              setActiveTab('experiments');
            }}
          />
        </TabsContent>

        <TabsContent value="results">
          {selectedExperiment ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Test Results: {selectedExperiment.name}</h2>
                <Button
                  variant="outline"
                  onClick={() => setSelectedExperiment(null)}
                >
                  Back to All Tests
                </Button>
              </div>
              <TestResults
                results={experimentManager.calculateTestResults(selectedExperiment)}
                onConcludeTest={() => handleStatusChange(selectedExperiment.id, 'completed')}
                onExtendTest={() => {
                  // Extend test duration
                  handleUpdateExperiment(selectedExperiment.id, {
                    maxDuration: (selectedExperiment.maxDuration || 30) + 7
                  });
                }}
              />
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">Select a Test to View Results</h3>
                <p className="text-muted-foreground mb-4">
                  Choose an experiment from the list to see detailed results and statistics
                </p>
                <Button onClick={() => setActiveTab('experiments')}>
                  View All Tests
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
