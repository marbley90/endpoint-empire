import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Contract } from './contract.model';

@Table
export class Job extends Model {
  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  description: string;

  @Column({
    type: DataType.DECIMAL(12, 2),
    allowNull: false,
  })
  price: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  paid: boolean;

  @Column({
    type: DataType.DATE,
  })
  paymentDate: Date;

  @ForeignKey(() => Contract)
  @Column
  ContractId: number;

  @BelongsTo(() => Contract)
  contract: Contract;
}
