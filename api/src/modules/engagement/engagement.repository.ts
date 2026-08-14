import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../common/repositories/base.repository';
import {
  Favorite,
  FavoriteDocument,
  Comparison,
  ComparisonDocument,
} from '../../database/schemas/engagement.schema';

@Injectable()
export class FavoritesRepository extends BaseRepository<FavoriteDocument> {
  constructor(@InjectModel(Favorite.name) model: Model<FavoriteDocument>) {
    super(model);
  }
}

@Injectable()
export class ComparisonsRepository extends BaseRepository<ComparisonDocument> {
  constructor(
    @InjectModel(Comparison.name) model: Model<ComparisonDocument>,
  ) {
    super(model);
  }
}
