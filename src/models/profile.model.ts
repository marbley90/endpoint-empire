import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { Contract } from './contract.model';

@Table
export class Profile extends Model {
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  firstName: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  lastName: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  profession: string;

  @Column({
    type: DataType.DECIMAL(12, 2),
  })
  balance: number;

  @Column({
    type: DataType.ENUM('client', 'contractor'),
  })
  type: 'client' | 'contractor';

  @HasMany(() => Contract, 'ContractorId')
  contractorContracts: Contract[];

  @HasMany(() => Contract, 'ClientId')
  clientContracts: Contract[];
}
