"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BenchmarkService = void 0;
const kysely_1 = require("kysely");
const db_1 = require("../db");
class BenchmarkService {
    static CACHE_TTL_MS = 60 * 60 * 1000; // 1h
    static MIN_SAMPLE_SIZE = 10;
    static METRICS = ['views', 'clicks', 'contacts', 'ctr'];
    static cache = new Map();
    static async getPlatformBenchmarks(segment = 'global') {
        const cacheHit = this.cache.get(segment);
        if (cacheHit && cacheHit.expiresAt > Date.now()) {
            return cacheHit.payload;
        }
        const latestSnapshot = await this.getLatestSnapshot(segment);
        if (latestSnapshot && this.isSnapshotFresh(latestSnapshot.calculated_at)) {
            this.cache.set(segment, {
                expiresAt: Date.now() + this.CACHE_TTL_MS,
                payload: latestSnapshot,
            });
            return latestSnapshot;
        }
        const computed = await this.computeAndPersist(segment);
        this.cache.set(segment, {
            expiresAt: Date.now() + this.CACHE_TTL_MS,
            payload: computed,
        });
        return computed;
    }
    static isSnapshotFresh(calculatedAtIso) {
        if (!calculatedAtIso)
            return false;
        return Date.now() - new Date(calculatedAtIso).getTime() < this.CACHE_TTL_MS;
    }
    static normalizeQuartiles(row) {
        return {
            p25: Number(row.p25) || 0,
            p50: Number(row.p50) || 0,
            p75: Number(row.p75) || 0,
        };
    }
    static buildPayload(params) {
        const available = params.sampleSize >= this.MIN_SAMPLE_SIZE && !!params.metrics;
        return {
            available,
            segment: params.segment,
            sample_size: params.sampleSize,
            minimum_sample_size: this.MIN_SAMPLE_SIZE,
            calculated_at: params.calculatedAt ? params.calculatedAt.toISOString() : null,
            metrics: available ? params.metrics : null,
            note: available
                ? `Comparado com todas as mesas da plataforma (base: ${params.sampleSize} mesas).`
                : `Benchmarks comparativos ficam disponíveis a partir de ${this.MIN_SAMPLE_SIZE} mesas ativas. Enquanto isso, mostramos sua tendência recente.`,
        };
    }
    static async getLatestSnapshot(segment) {
        const latest = await db_1.db
            .selectFrom('benchmark_snapshots')
            .select('calculated_at')
            .where('segment', '=', segment)
            .orderBy('calculated_at', 'desc')
            .executeTakeFirst();
        if (!latest) {
            return null;
        }
        const rows = await db_1.db
            .selectFrom('benchmark_snapshots')
            .select(['metric', 'p25', 'p50', 'p75', 'sample_size', 'calculated_at'])
            .where('segment', '=', segment)
            .where('calculated_at', '=', latest.calculated_at)
            .execute();
        if (rows.length === 0) {
            return null;
        }
        const metricMap = new Map(rows.map((row) => [row.metric, row]));
        const hasAllMetrics = this.METRICS.every((metric) => metricMap.has(metric));
        if (!hasAllMetrics) {
            return null;
        }
        const metrics = {
            views: this.normalizeQuartiles(metricMap.get('views')),
            clicks: this.normalizeQuartiles(metricMap.get('clicks')),
            contacts: this.normalizeQuartiles(metricMap.get('contacts')),
            ctr: this.normalizeQuartiles(metricMap.get('ctr')),
        };
        const sampleSize = Number(rows[0].sample_size) || 0;
        const calculatedAt = rows[0].calculated_at ? new Date(rows[0].calculated_at) : null;
        return this.buildPayload({
            segment,
            sampleSize,
            calculatedAt,
            metrics,
        });
    }
    static async computeAndPersist(segment) {
        const stats = await db_1.db
            .selectFrom('tables as t')
            .leftJoin('table_metrics as tm', 'tm.table_id', 't.id')
            .select([
            (0, kysely_1.sql) `COUNT(*)::int`.as('sample_size'),
            (0, kysely_1.sql) `PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY COALESCE(tm.views_count, 0))`.as('views_p25'),
            (0, kysely_1.sql) `PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY COALESCE(tm.views_count, 0))`.as('views_p50'),
            (0, kysely_1.sql) `PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY COALESCE(tm.views_count, 0))`.as('views_p75'),
            (0, kysely_1.sql) `PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY COALESCE(tm.clicks_count, 0))`.as('clicks_p25'),
            (0, kysely_1.sql) `PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY COALESCE(tm.clicks_count, 0))`.as('clicks_p50'),
            (0, kysely_1.sql) `PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY COALESCE(tm.clicks_count, 0))`.as('clicks_p75'),
            (0, kysely_1.sql) `PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY COALESCE(tm.contacts_count, 0))`.as('contacts_p25'),
            (0, kysely_1.sql) `PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY COALESCE(tm.contacts_count, 0))`.as('contacts_p50'),
            (0, kysely_1.sql) `PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY COALESCE(tm.contacts_count, 0))`.as('contacts_p75'),
            (0, kysely_1.sql) `PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY CASE WHEN COALESCE(tm.views_count, 0) > 0 THEN (COALESCE(tm.clicks_count, 0)::numeric / COALESCE(tm.views_count, 0)::numeric) * 100 ELSE 0 END)`.as('ctr_p25'),
            (0, kysely_1.sql) `PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY CASE WHEN COALESCE(tm.views_count, 0) > 0 THEN (COALESCE(tm.clicks_count, 0)::numeric / COALESCE(tm.views_count, 0)::numeric) * 100 ELSE 0 END)`.as('ctr_p50'),
            (0, kysely_1.sql) `PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY CASE WHEN COALESCE(tm.views_count, 0) > 0 THEN (COALESCE(tm.clicks_count, 0)::numeric / COALESCE(tm.views_count, 0)::numeric) * 100 ELSE 0 END)`.as('ctr_p75'),
        ])
            .where('t.status', 'in', ['active', 'full'])
            .executeTakeFirst();
        const sampleSize = Number(stats?.sample_size) || 0;
        const metrics = {
            views: {
                p25: Number(stats?.views_p25) || 0,
                p50: Number(stats?.views_p50) || 0,
                p75: Number(stats?.views_p75) || 0,
            },
            clicks: {
                p25: Number(stats?.clicks_p25) || 0,
                p50: Number(stats?.clicks_p50) || 0,
                p75: Number(stats?.clicks_p75) || 0,
            },
            contacts: {
                p25: Number(stats?.contacts_p25) || 0,
                p50: Number(stats?.contacts_p50) || 0,
                p75: Number(stats?.contacts_p75) || 0,
            },
            ctr: {
                p25: Number(stats?.ctr_p25) || 0,
                p50: Number(stats?.ctr_p50) || 0,
                p75: Number(stats?.ctr_p75) || 0,
            },
        };
        const calculatedAt = new Date();
        await db_1.db
            .insertInto('benchmark_snapshots')
            .values([
            {
                calculated_at: calculatedAt,
                segment,
                metric: 'views',
                p25: String(metrics.views.p25),
                p50: String(metrics.views.p50),
                p75: String(metrics.views.p75),
                sample_size: sampleSize,
            },
            {
                calculated_at: calculatedAt,
                segment,
                metric: 'clicks',
                p25: String(metrics.clicks.p25),
                p50: String(metrics.clicks.p50),
                p75: String(metrics.clicks.p75),
                sample_size: sampleSize,
            },
            {
                calculated_at: calculatedAt,
                segment,
                metric: 'contacts',
                p25: String(metrics.contacts.p25),
                p50: String(metrics.contacts.p50),
                p75: String(metrics.contacts.p75),
                sample_size: sampleSize,
            },
            {
                calculated_at: calculatedAt,
                segment,
                metric: 'ctr',
                p25: String(metrics.ctr.p25),
                p50: String(metrics.ctr.p50),
                p75: String(metrics.ctr.p75),
                sample_size: sampleSize,
            },
        ])
            .execute();
        return this.buildPayload({
            segment,
            sampleSize,
            calculatedAt,
            metrics,
        });
    }
}
exports.BenchmarkService = BenchmarkService;
