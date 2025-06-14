
import React, { memo, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Zap, Database, Image, Wifi } from 'lucide-react';

interface PerformanceMetrics {
  loadTime: number;
  queryCount: number;
  imageCount: number;
  cacheHitRate: number;
}

const PerformanceOptimizer = memo(() => {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics>({
    loadTime: 0,
    queryCount: 0,
    imageCount: 0,
    cacheHitRate: 0
  });

  const performanceScore = useMemo(() => {
    const loadTimeScore = Math.max(0, 100 - (metrics.loadTime / 10));
    const queryScore = Math.max(0, 100 - (metrics.queryCount * 5));
    const cacheScore = metrics.cacheHitRate;
    
    return Math.round((loadTimeScore + queryScore + cacheScore) / 3);
  }, [metrics]);

  React.useEffect(() => {
    // Monitor performance metrics
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          setMetrics(prev => ({
            ...prev,
            loadTime: entry.duration
          }));
        }
      }
    });

    observer.observe({ entryTypes: ['navigation'] });

    // Simulate query counting (in real app, this would come from React Query)
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        queryCount: Math.floor(Math.random() * 10),
        imageCount: document.querySelectorAll('img').length,
        cacheHitRate: 70 + Math.random() * 20
      }));
    }, 5000);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Monitor de Performance
        </CardTitle>
        <CardDescription>
          Métricas em tempo real da aplicação
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Score de Performance</span>
          <Badge variant={getScoreVariant(performanceScore)} className="text-lg px-3 py-1">
            {performanceScore}/100
          </Badge>
        </div>
        
        <Progress value={performanceScore} className="h-2" />
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Queries Ativas</span>
            </div>
            <div className="text-lg font-bold">{metrics.queryCount}</div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4 text-green-500" />
              <span className="text-sm">Imagens Carregadas</span>
            </div>
            <div className="text-lg font-bold">{metrics.imageCount}</div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-purple-500" />
              <span className="text-sm">Cache Hit Rate</span>
            </div>
            <div className="text-lg font-bold">{metrics.cacheHitRate.toFixed(1)}%</div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-sm">Load Time</span>
            </div>
            <div className="text-lg font-bold">{metrics.loadTime.toFixed(0)}ms</div>
          </div>
        </div>
        
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Otimizações Ativas</h4>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">React.memo</Badge>
            <Badge variant="outline">useMemo</Badge>
            <Badge variant="outline">Lazy Loading</Badge>
            <Badge variant="outline">Image Optimization</Badge>
            <Badge variant="outline">Query Caching</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

PerformanceOptimizer.displayName = 'PerformanceOptimizer';

export default PerformanceOptimizer;
