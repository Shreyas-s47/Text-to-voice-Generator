// Performance Monitoring for Text-to-Voice Generator
// Real-time performance tracking and optimization insights

class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.observers = new Map();
        this.isEnabled = true;
        
        this.init();
    }

    init() {
        if (!this.isEnabled || !('performance' in window)) {
            console.warn('Performance monitoring not available');
            return;
        }

        this.setupObservers();
        this.trackCoreWebVitals();
        this.monitorMemoryUsage();
        this.trackUserInteractions();
    }

    setupObservers() {
        // Performance Observer for navigation timing
        if ('PerformanceObserver' in window) {
            try {
                // Navigation timing
                const navObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        this.processNavigationEntry(entry);
                    }
                });
                navObserver.observe({ entryTypes: ['navigation'] });
                this.observers.set('navigation', navObserver);

                // Measure timing
                const measureObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        this.processMeasureEntry(entry);
                    }
                });
                measureObserver.observe({ entryTypes: ['measure'] });
                this.observers.set('measure', measureObserver);

                // Long tasks (performance bottlenecks)
                const longTaskObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        this.processLongTaskEntry(entry);
                    }
                });
                longTaskObserver.observe({ entryTypes: ['longtask'] });
                this.observers.set('longtask', longTaskObserver);

            } catch (error) {
                console.warn('PerformanceObserver setup failed:', error);
            }
        }
    }

    trackCoreWebVitals() {
        // First Contentful Paint (FCP)
        this.measureFCP();
        
        // Largest Contentful Paint (LCP)
        this.measureLCP();
        
        // Cumulative Layout Shift (CLS)
        this.measureCLS();
        
        // First Input Delay (FID)
        this.measureFID();
    }

    measureFCP() {
        try {
            const fcpObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.name === 'first-contentful-paint') {
                        this.recordMetric('FCP', entry.startTime);
                        fcpObserver.disconnect();
                    }
                }
            });
            fcpObserver.observe({ entryTypes: ['paint'] });
        } catch (error) {
            console.warn('FCP measurement failed:', error);
        }
    }

    measureLCP() {
        try {
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.recordMetric('LCP', lastEntry.startTime);
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            
            // Disconnect on page hidden to get final LCP
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'hidden') {
                    lcpObserver.disconnect();
                }
            }, { once: true });
        } catch (error) {
            console.warn('LCP measurement failed:', error);
        }
    }

    measureCLS() {
        try {
            let clsValue = 0;
            const clsObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                        this.recordMetric('CLS', clsValue);
                    }
                }
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });
        } catch (error) {
            console.warn('CLS measurement failed:', error);
        }
    }

    measureFID() {
        try {
            const fidObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordMetric('FID', entry.processingStart - entry.startTime);
                    fidObserver.disconnect();
                }
            });
            fidObserver.observe({ entryTypes: ['first-input'] });
        } catch (error) {
            console.warn('FID measurement failed:', error);
        }
    }

    monitorMemoryUsage() {
        if ('memory' in performance) {
            const checkMemory = () => {
                const memory = performance.memory;
                this.recordMetric('JS_HEAP_SIZE', memory.usedJSHeapSize);
                this.recordMetric('JS_HEAP_LIMIT', memory.totalJSHeapSize);
                this.recordMetric('JS_HEAP_USED_PCT', 
                    (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100);
            };

            // Check memory usage periodically
            checkMemory();
            setInterval(checkMemory, 10000); // Every 10 seconds
        }
    }

    trackUserInteractions() {
        // Track click interactions
        document.addEventListener('click', (event) => {
            const target = event.target.closest('button, [role="button"]');
            if (target) {
                this.startMeasure(`click-${target.id || 'unknown'}`);
            }
        });

        // Track input interactions
        document.addEventListener('input', (event) => {
            if (event.target.type === 'range') {
                this.recordMetric('SLIDER_INTERACTION', performance.now());
            }
        });

        // Track speech synthesis events
        window.addEventListener('speechstart', () => {
            this.startMeasure('speech-synthesis');
        });

        window.addEventListener('speechend', () => {
            this.endMeasure('speech-synthesis');
        });
    }

    processNavigationEntry(entry) {
        const metrics = {
            DNS_LOOKUP: entry.domainLookupEnd - entry.domainLookupStart,
            TCP_CONNECT: entry.connectEnd - entry.connectStart,
            TLS_HANDSHAKE: entry.secureConnectionStart > 0 ? 
                entry.connectEnd - entry.secureConnectionStart : 0,
            TTFB: entry.responseStart - entry.requestStart,
            DOWNLOAD: entry.responseEnd - entry.responseStart,
            DOM_PROCESSING: entry.domComplete - entry.domLoading,
            LOAD_COMPLETE: entry.loadEventEnd - entry.navigationStart
        };

        Object.entries(metrics).forEach(([key, value]) => {
            this.recordMetric(key, value);
        });
    }

    processMeasureEntry(entry) {
        this.recordMetric(`MEASURE_${entry.name.toUpperCase()}`, entry.duration);
    }

    processLongTaskEntry(entry) {
        this.recordMetric('LONG_TASK', entry.duration);
        
        // Warn about performance issues
        if (entry.duration > 100) {
            console.warn(`Long task detected: ${entry.duration}ms`, entry);
        }
    }

    startMeasure(name) {
        performance.mark(`${name}-start`);
    }

    endMeasure(name) {
        const startMark = `${name}-start`;
        const endMark = `${name}-end`;
        
        performance.mark(endMark);
        
        try {
            performance.measure(name, startMark, endMark);
        } catch (error) {
            console.warn(`Failed to measure ${name}:`, error);
        }
    }

    recordMetric(name, value) {
        const timestamp = Date.now();
        
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        
        this.metrics.get(name).push({ value, timestamp });
        
        // Keep only last 100 entries per metric
        const entries = this.metrics.get(name);
        if (entries.length > 100) {
            entries.splice(0, entries.length - 100);
        }
        
        // Log significant metrics
        this.logSignificantMetrics(name, value);
    }

    logSignificantMetrics(name, value) {
        const thresholds = {
            FCP: 1800,  // Good < 1.8s
            LCP: 2500,  // Good < 2.5s
            CLS: 0.1,   // Good < 0.1
            FID: 100,   // Good < 100ms
            LONG_TASK: 50,
            JS_HEAP_USED_PCT: 80
        };

        if (thresholds[name] && value > thresholds[name]) {
            console.warn(`Performance threshold exceeded: ${name} = ${value}`);
        }
    }

    getMetrics() {
        const summary = {};
        
        for (const [name, entries] of this.metrics) {
            const values = entries.map(e => e.value);
            summary[name] = {
                current: values[values.length - 1],
                average: values.reduce((a, b) => a + b, 0) / values.length,
                min: Math.min(...values),
                max: Math.max(...values),
                count: values.length
            };
        }
        
        return summary;
    }

    generateReport() {
        const metrics = this.getMetrics();
        const report = {
            timestamp: new Date().toISOString(),
            coreWebVitals: {
                FCP: metrics.FCP,
                LCP: metrics.LCP,
                CLS: metrics.CLS,
                FID: metrics.FID
            },
            performance: {
                loadTime: metrics.LOAD_COMPLETE,
                domProcessing: metrics.DOM_PROCESSING,
                longTasks: metrics.LONG_TASK?.count || 0
            },
            memory: {
                heapUsed: metrics.JS_HEAP_SIZE,
                heapUsedPercent: metrics.JS_HEAP_USED_PCT
            },
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        console.group('🚀 Performance Report');
        console.table(report.coreWebVitals);
        console.log('Full Report:', report);
        console.groupEnd();
        
        return report;
    }

    sendToAnalytics(report) {
        // Send performance data to analytics service
        // This is a placeholder - replace with actual analytics endpoint
        
        if ('sendBeacon' in navigator) {
            const data = JSON.stringify(report);
            navigator.sendBeacon('/analytics/performance', data);
        } else {
            fetch('/analytics/performance', {
                method: 'POST',
                body: JSON.stringify(report),
                headers: { 'Content-Type': 'application/json' },
                keepalive: true
            }).catch(error => {
                console.warn('Failed to send performance data:', error);
            });
        }
    }

    startContinuousMonitoring() {
        // Generate reports every 30 seconds
        setInterval(() => {
            const report = this.generateReport();
            this.sendToAnalytics(report);
        }, 30000);
        
        // Generate final report on page unload
        window.addEventListener('beforeunload', () => {
            const report = this.generateReport();
            this.sendToAnalytics(report);
        });
    }

    destroy() {
        // Clean up observers
        for (const [name, observer] of this.observers) {
            observer.disconnect();
        }
        this.observers.clear();
        this.metrics.clear();
    }
}

// Auto-initialize performance monitoring
if (typeof window !== 'undefined') {
    window.performanceMonitor = new PerformanceMonitor();
    
    // Start continuous monitoring
    window.performanceMonitor.startContinuousMonitoring();
    
    // Expose methods for manual analysis
    window.getPerformanceReport = () => window.performanceMonitor.generateReport();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceMonitor;
}