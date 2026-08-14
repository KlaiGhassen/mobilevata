import { Document, Model, PopulateOptions, UpdateQuery } from 'mongoose';

export type PopulateArg = string | PopulateOptions;

export abstract class BaseRepository<T extends Document> {
  constructor(protected readonly model: Model<T>) {}

  create(data: Partial<T>): Promise<T> {
    return this.model.create(data);
  }

  findById(id: string): Promise<T | null> {
    return this.model.findById(id).exec();
  }

  findOne(filter: Record<string, unknown>): Promise<T | null> {
    return this.model.findOne(filter).exec();
  }

  findMany(
    filter: Record<string, unknown> = {},
    options: {
      skip?: number;
      limit?: number;
      sort?: Record<string, 1 | -1>;
      populate?: PopulateArg | PopulateArg[];
    } = {},
  ): Promise<T[]> {
    let query = this.model.find(filter);
    if (options.populate) {
      const pops = Array.isArray(options.populate)
        ? options.populate
        : [options.populate];
      for (const p of pops) {
        if (typeof p === 'string') {
          query = query.populate(p);
        } else {
          query = query.populate(p);
        }
      }
    }
    if (options.sort) query = query.sort(options.sort);
    if (options.skip) query = query.skip(options.skip);
    if (options.limit) query = query.limit(options.limit);
    return query.exec();
  }
  count(filter: Record<string, unknown> = {}): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }

  updateById(id: string, update: UpdateQuery<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, update, { new: true }).exec();
  }

  deleteById(id: string): Promise<T | null> {
    return this.model.findByIdAndDelete(id).exec();
  }

  deleteMany(filter: Record<string, unknown>): Promise<{ deletedCount?: number }> {
    return this.model.deleteMany(filter).exec();
  }

  upsert(
    filter: Record<string, unknown>,
    data: UpdateQuery<T>,
  ): Promise<T | null> {
    return this.model
      .findOneAndUpdate(filter, data, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      })
      .exec();
  }
}
