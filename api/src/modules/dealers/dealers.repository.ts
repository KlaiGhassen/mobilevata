import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../common/repositories/base.repository';
import { Dealer, DealerDocument } from '../../database/schemas/dealer.schema';

@Injectable()
export class DealersRepository extends BaseRepository<DealerDocument> {
  constructor(@InjectModel(Dealer.name) model: Model<DealerDocument>) {
    super(model);
  }
}
