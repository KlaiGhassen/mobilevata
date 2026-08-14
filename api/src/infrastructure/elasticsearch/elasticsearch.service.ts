import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';
import { SearchVehiclesDto } from '../../modules/vehicles/dto/search-vehicles.dto';
import { escapeEsWildcard } from '../../common/security/escape';

export const VEHICLE_INDEX = 'autovia_vehicles';

export type VehicleSearchHit = {
  id: string;
  score?: number;
};

@Injectable()
export class ElasticsearchService implements OnModuleInit {
  private readonly logger = new Logger(ElasticsearchService.name);
  private client: Client | null = null;
  enabled = false;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const node =
      this.config.get<string>('ELASTICSEARCH_NODE') || 'http://127.0.0.1:9200';
    this.client = new Client({ node, requestTimeout: 5000 });
    try {
      await this.client.ping();
      this.enabled = true;
      await this.ensureIndex();
      this.logger.log('Elasticsearch connected');
    } catch (err) {
      this.enabled = false;
      this.logger.warn(
        `Elasticsearch unavailable — falling back to Mongo search (${(err as Error).message})`,
      );
    }
  }

  private async ensureIndex() {
    if (!this.client) return;
    const exists = await this.client.indices.exists({ index: VEHICLE_INDEX });
    if (exists) return;
    await this.client.indices.create({
      index: VEHICLE_INDEX,
      settings: {
        number_of_shards: 1,
        number_of_replicas: 0,
        analysis: {
          analyzer: {
            vehicle_analyzer: {
              type: 'custom',
              tokenizer: 'standard',
              filter: ['lowercase', 'asciifolding'],
            },
          },
        },
      },
      mappings: {
        properties: {
          title: { type: 'text', analyzer: 'vehicle_analyzer' },
          description: { type: 'text', analyzer: 'vehicle_analyzer' },
          brandName: { type: 'keyword' },
          modelName: { type: 'keyword' },
          brandId: { type: 'keyword' },
          modelId: { type: 'keyword' },
          price: { type: 'integer' },
          year: { type: 'integer' },
          mileage: { type: 'integer' },
          fuelType: { type: 'keyword' },
          transmission: { type: 'keyword' },
          bodyType: { type: 'keyword' },
          country: { type: 'keyword' },
          condition: { type: 'keyword' },
          color: { type: 'keyword' },
          sellersType: { type: 'keyword' },
          categoryTags: { type: 'keyword' },
          published: { type: 'boolean' },
          createdAt: { type: 'date' },
        },
      },
    });
  }

  async indexVehicle(doc: Record<string, unknown>) {
    if (!this.enabled || !this.client || !doc.id) return;
    try {
      await this.client.index({
        index: VEHICLE_INDEX,
        id: String(doc.id),
        document: doc,
        refresh: true,
      });
    } catch (err) {
      this.logger.warn(`ES index failed: ${(err as Error).message}`);
    }
  }

  async deleteVehicle(id: string) {
    if (!this.enabled || !this.client) return;
    try {
      await this.client.delete({ index: VEHICLE_INDEX, id, refresh: true });
    } catch {
      /* ignore missing */
    }
  }

  async searchIds(query: SearchVehiclesDto): Promise<{ total: number; ids: string[] } | null> {
    if (!this.enabled || !this.client) return null;

    const filter: Record<string, unknown>[] = [{ term: { published: true } }];
    const must: Record<string, unknown>[] = [];

    if (query.brandId) filter.push({ term: { brandId: query.brandId } });
    if (query.modelId) filter.push({ term: { modelId: query.modelId } });
    if (query.fuelType) filter.push({ term: { fuelType: query.fuelType } });
    if (query.transmission) filter.push({ term: { transmission: query.transmission } });
    if (query.bodyType) filter.push({ term: { bodyType: query.bodyType } });
    if (query.country) filter.push({ term: { country: query.country } });
    if (query.condition) filter.push({ term: { condition: query.condition } });
    if (query.sellersType) filter.push({ term: { sellersType: query.sellersType } });
    if (query.category) filter.push({ term: { categoryTags: query.category } });
    if (query.color) {
      filter.push({
        wildcard: {
          color: `*${escapeEsWildcard(query.color.toLowerCase())}*`,
        },
      });
    }

    const rangePrice: Record<string, number> = {};
    if (query.priceMin != null) rangePrice.gte = query.priceMin;
    if (query.priceMax != null) rangePrice.lte = query.priceMax;
    if (Object.keys(rangePrice).length) filter.push({ range: { price: rangePrice } });

    const rangeYear: Record<string, number> = {};
    if (query.yearMin != null) rangeYear.gte = query.yearMin;
    if (query.yearMax != null) rangeYear.lte = query.yearMax;
    if (Object.keys(rangeYear).length) filter.push({ range: { year: rangeYear } });

    if (query.mileageMax != null) filter.push({ range: { mileage: { lte: query.mileageMax } } });

    if (query.q) {
      must.push({
        multi_match: {
          query: query.q,
          fields: ['title^3', 'description', 'brandName^2', 'modelName^2'],
          fuzziness: 'AUTO',
        },
      });
    }

    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 50) : 20;

    let sort: Record<string, 'asc' | 'desc'>[] | undefined;
    switch (query.sort) {
      case 'price_asc':
        sort = [{ price: 'asc' }];
        break;
      case 'price_desc':
        sort = [{ price: 'desc' }];
        break;
      case 'year_desc':
        sort = [{ year: 'desc' }];
        break;
      case 'mileage_asc':
        sort = [{ mileage: 'asc' }];
        break;
      default:
        sort = query.q ? undefined : [{ createdAt: 'desc' }];
    }

    try {
      const res = await this.client.search({
        index: VEHICLE_INDEX,
        from: (page - 1) * limit,
        size: limit,
        track_total_hits: true,
        query: {
          bool: {
            filter,
            must: must.length ? must : [{ match_all: {} }],
          },
        },
        sort,
      });

      const total =
        typeof res.hits.total === 'number'
          ? res.hits.total
          : res.hits.total?.value || 0;
      const ids = res.hits.hits.map((h) => String(h._id));
      return { total, ids };
    } catch (err) {
      this.logger.warn(`ES search failed: ${(err as Error).message}`);
      return null;
    }
  }

  async bulkIndex(docs: Record<string, unknown>[]) {
    if (!this.enabled || !this.client || !docs.length) return;
    const operations = docs.flatMap((doc) => [
      { index: { _index: VEHICLE_INDEX, _id: String(doc.id) } },
      doc,
    ]);
    try {
      await this.client.bulk({ refresh: true, operations });
    } catch (err) {
      this.logger.warn(`ES bulk index failed: ${(err as Error).message}`);
    }
  }
}
