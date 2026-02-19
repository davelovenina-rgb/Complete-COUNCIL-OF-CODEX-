
import { BuildMetric } from '../types';
import { getState, saveState } from '../utils/db';

class MetricsCollector {
    private static instance: MetricsCollector;
    private currentMetrics: BuildMetric[] = [];

    private constructor() {}

    public static getInstance(): MetricsCollector {
        if (!MetricsCollector.instance) {
            MetricsCollector.instance = new MetricsCollector();
        }
        return MetricsCollector.instance;
    }

    async logBuild(success: boolean, duration: number, errorType?: string) {
        const metric: BuildMetric = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            duration,
            success,
            errorType,
            apkSize: await this.estimateStorageUsage()
        };

        const history = await getState<BuildMetric[]>('build_metrics') || [];
        const updated = [metric, ...history].slice(0, 50);
        await saveState('build_metrics', updated);
        return metric;
    }

    private async estimateStorageUsage(): Promise<number> {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            return estimate.usage || 0;
        }
        return 0;
    }

    async getHistory(): Promise<BuildMetric[]> {
        return await getState<BuildMetric[]>('build_metrics') || [];
    }
}

export const metricsCollector = MetricsCollector.getInstance();
