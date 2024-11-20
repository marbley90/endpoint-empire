import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { Profile } from './profile.model';
import { Job } from './job.model';

@Table
export class Contract extends Model {
  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  terms: string;

  @Column({
    type: DataType.ENUM('new', 'in_progress', 'terminated'),
  })
  status: 'new' | 'in_progress' | 'terminated';

  @ForeignKey(() => Profile)
  @Column
  ContractorId: number;

  @BelongsTo(() => Profile, { foreignKey: 'ContractorId', as: 'Contractor' })
  contractor: Profile;

  @ForeignKey(() => Profile)
  @Column
  ClientId: number;

  @BelongsTo(() => Profile, { foreignKey: 'ClientId', as: 'Client' })
  client: Profile;

  @HasMany(() => Job)
  jobs: Job[];
}
