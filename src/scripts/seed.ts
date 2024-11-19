import { Sequelize } from 'sequelize-typescript';
import { Profile } from '../models/profile.model';
import { Contract } from '../models/contract.model';
import { Job } from '../models/job.model';

async function seed() {
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'database.sqlite',
    models: [Profile, Contract, Job],
  });

  // Ensure tables are created without dropping them
  await sequelize.sync();

  // Insert data if it doesn't already exist
  await Profile.bulkCreate([
    { id: 1, firstName: 'Harry', lastName: 'Potter', profession: 'Wizard', balance: 1150, type: 'client' },
    { id: 2, firstName: 'Mr', lastName: 'Robot', profession: 'Hacker', balance: 231.11, type: 'client' },
    { id: 3, firstName: 'John', lastName: 'Snow', profession: 'Knows nothing', balance: 451.3, type:'client' },
    { id: 4, firstName: 'Ash', lastName: 'Kethcum', profession: 'Pokemon master', balance: 1.3, type:'client' },
    { id: 5, firstName: 'John', lastName: 'Lenon', profession: 'Musician', balance: 64, type:'contractor' },
    { id: 6, firstName: 'Linus', lastName: 'Torvalds', profession: 'Programmer', balance: 1214, type:'contractor' },
    { id: 7, firstName: 'Alan', lastName: 'Turing', profession: 'Programmer', balance: 22, type:'contractor' },
    { id: 8, firstName: 'Aragorn', lastName: 'II Elessar Telcontarvalds', profession: 'Fighter', balance: 314, type:'contractor' },
  ], { ignoreDuplicates: true });

  await Contract.bulkCreate([
    { id: 1, terms: 'bla bla bla', status: 'terminated', ClientId: 1, ContractorId: 5 },
    { id: 2, terms: 'bla bla bla', status: 'in_progress', ClientId: 1, ContractorId: 6 },
    { id: 3, terms: 'bla bla bla', status: 'in_progress', ClientId: 2, ContractorId: 6 },
    { id: 4, terms: 'bla bla bla', status: 'in_progress', ClientId: 2, ContractorId: 7 },
    { id: 5, terms: 'bla bla bla', status: 'new', ClientId: 3, ContractorId: 8 },
    { id: 6, terms: 'bla bla bla', status: 'in_progress', ClientId: 3, ContractorId: 7 },
    { id: 7, terms: 'bla bla bla', status: 'in_progress', ClientId: 4, ContractorId: 7 },
    { id: 8, terms: 'bla bla bla', status: 'in_progress', ClientId: 4, ContractorId: 6 },
    { id: 9, terms: 'bla bla bla', status: 'in_progress', ClientId: 4, ContractorId: 8 },
  ], { ignoreDuplicates: true });

  await Job.bulkCreate([
    { description: 'work', price: 200, ContractId: 1 },
    { description: 'work', price: 201, ContractId: 2 },
    { description: 'work', price: 202, ContractId: 3, },
    { description: 'work', price: 200, ContractId: 4, },
    { description: 'work', price: 200, ContractId: 7, },
    { description: 'work', price: 2020, paid: true, paymentDate: '2020-08-15T19:11:26.737Z', ContractId: 7, },
    { description: 'work', price: 200, paid: true, paymentDate: '2020-08-15T19:11:26.737Z', ContractId: 2, },
    { description: 'work', price: 200, paid: true, paymentDate: '2020-08-16T19:11:26.737Z', ContractId: 3, },
    { description: 'work', price: 200, paid: true, paymentDate: '2020-08-17T19:11:26.737Z', ContractId: 1, },
    { description: 'work', price: 200, paid: true, paymentDate: '2020-08-17T19:11:26.737Z', ContractId: 5, },
    { description: 'work', price: 21, paid: true, paymentDate: '2020-08-10T19:11:26.737Z', ContractId: 1, },
    { description: 'work', price: 21, paid: true, paymentDate: '2020-08-15T19:11:26.737Z', ContractId: 2, },
    { description: 'work', price: 121, paid: true, paymentDate: '2020-08-15T19:11:26.737Z', ContractId: 3, },
    { description: 'work', price: 121, paid: true, paymentDate: '2020-08-14T23:11:26.737Z', ContractId: 3, }
    ], { ignoreDuplicates: true });

  console.log('Seeding completed!');
  process.exit();
}
seed();
