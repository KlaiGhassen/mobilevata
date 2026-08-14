import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../common/repositories/base.repository';
import {
  Reclamation,
  ReclamationDocument,
} from '../../database/schemas/reclamation.schema';

@Injectable()
export class ReclamationsRepository extends BaseRepository<ReclamationDocument> {
  constructor(@InjectModel(Reclamation.name) model: Model<ReclamationDocument>) {
    super(model);
  }
}
