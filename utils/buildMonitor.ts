
/**
 * Universal Build Monitor (The Historian)
 * A standard, framework-agnostic component for tracking build history, features, and application health.
 */

export interface BuildInfo {
  id: string;
  version: string;
  buildNumber: number;
  timestamp: number;
  environment: 'development' | 'production' | 'test';
  features: string[];
  changes: string[];
  knownIssues: string[];
  buildSuccess: boolean;
  buildDuration?: number;
  buildErrors?: string[];
  metadata?: Record<string, any>;
}

export interface BuildHistory {
  builds: BuildInfo[];
  currentBuildId: string;
  totalBuilds: number;
}

export interface BuildComparison {
  baseBuild: BuildInfo;
  targetBuild: BuildInfo;
  addedFeatures: string[];
  removedFeatures: string[];
  newChanges: string[];
  resolvedIssues: string[];
  newIssues: string[];
}

export interface MonitorConfig {
  appName: string;
  initialBuildInfo: Partial<BuildInfo>;
  maxHistory?: number;
  logger?: Logger;
}

export interface Logger {
  info(message: string, context?: Record<string, any>): void;
  warn(message: string, context?: Record<string, any>): void;
  error(message: string, context?: Record<string, any>): void;
}

export class UniversalBuildMonitor {
  private static instance: UniversalBuildMonitor;
  private config: MonitorConfig;
  private builds: BuildInfo[] = [];
  private currentBuild: BuildInfo;
  private logger: Logger;
  private storageKeys: { history: string };

  private constructor(config: MonitorConfig) {
    if (!config.appName) {
      throw new Error('[UniversalBuildMonitor] appName is required in config.');
    }
    this.config = {
      ...config,
      maxHistory: config.maxHistory || 50,
    };

    this.logger = config.logger || {
      info: (message, context) => console.log(`[INFO] ${message}`, context || ''),
      warn: (message, context) => console.warn(`[WARN] ${message}`, context || ''),
      error: (message, context) => console.error(`[ERROR] ${message}`, context || ''),
    };

    this.storageKeys = {
      history: `${this.config.appName}_build_history`,
    };

    this.currentBuild = this.initializeCurrentBuild();
    this.loadBuildHistory();
    this.logger.info('UniversalBuildMonitor initialized.', { buildInfo: this.currentBuild });
  }

  public static initialize(config: MonitorConfig): UniversalBuildMonitor {
    if (!UniversalBuildMonitor.instance) {
      UniversalBuildMonitor.instance = new UniversalBuildMonitor(config);
    }
    return UniversalBuildMonitor.instance;
  }

  public static getInstance(): UniversalBuildMonitor {
    if (!UniversalBuildMonitor.instance) {
      throw new Error('[UniversalBuildMonitor] Must be initialized before use.');
    }
    return UniversalBuildMonitor.instance;
  }

  public getCurrentBuild(): BuildInfo {
    return { ...this.currentBuild };
  }

  public getBuildHistory(limit?: number): BuildInfo[] {
    const history = [...this.builds];
    return limit ? history.slice(-limit) : history;
  }

  public getBuildById(buildId: string): BuildInfo | undefined {
    return this.builds.find(b => b.id === buildId);
  }

  public getBuildStatistics() {
    const totalBuilds = this.builds.length;
    if (totalBuilds === 0) return { totalBuilds: 0 };

    const successfulBuilds = this.builds.filter(b => b.buildSuccess).length;
    const buildsWithDuration = this.builds.filter(b => typeof b.buildDuration === 'number');
    const averageBuildDuration = buildsWithDuration.reduce((sum, b) => sum + (b.buildDuration || 0), 0) / (buildsWithDuration.length || 1);

    return {
      totalBuilds,
      successfulBuilds,
      failedBuilds: totalBuilds - successfulBuilds,
      successRate: (successfulBuilds / totalBuilds) * 100,
      averageBuildDuration,
      currentVersion: this.currentBuild.version,
      currentBuildNumber: this.currentBuild.buildNumber,
      featureCount: this.currentBuild.features.length,
      knownIssuesCount: this.currentBuild.knownIssues.length,
    };
  }

  private initializeCurrentBuild(): BuildInfo {
    return {
      id: `build-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      version: '6.0.0',
      buildNumber: Date.now(),
      timestamp: Date.now(),
      environment: 'production',
      features: ['Neural Compactor', 'Vault Awareness', 'Web Access', 'Keep-Alive Voice', 'The Historian'],
      changes: ['Removed Drive Mode', 'Optimized context management', 'Integrated Big Four API fields'],
      knownIssues: [],
      buildSuccess: true,
      ...this.config.initialBuildInfo,
    };
  }

  private saveBuildHistory(): void {
    try {
      const data: BuildHistory = {
        builds: this.builds,
        currentBuildId: this.currentBuild.id,
        totalBuilds: this.builds.length,
      };
      localStorage.setItem(this.storageKeys.history, JSON.stringify(data));
    } catch (error) {
      this.logger.error('Failed to save build history.', { error });
    }
  }

  private loadBuildHistory(): void {
    try {
      const data = localStorage.getItem(this.storageKeys.history);
      if (data) {
        const parsed: BuildHistory = JSON.parse(data);
        this.builds = parsed.builds || [];
      } else {
        this.builds.push(this.currentBuild);
      }
      if (!this.builds.find(b => b.id === this.currentBuild.id)) {
        this.builds.push(this.currentBuild);
      }
      while (this.builds.length > this.config.maxHistory!) {
        this.builds.shift();
      }
      this.saveBuildHistory();
    } catch (error) {
      this.logger.error('Failed to load build history.', { error });
      this.builds = [this.currentBuild];
    }
  }
}
