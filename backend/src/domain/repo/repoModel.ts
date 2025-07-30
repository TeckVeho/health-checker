import { Model } from 'sequelize';
import sequelize from '../../config/database';
import { repoAttributes, repoModelOptions } from './repoSchema';

// Define Repo model
class Repo extends Model {
  public id!: number;
  public name!: string;
  public owner!: string;
  public description?: string;
  public topics?: string[];
  public isPrivate!: boolean;

  public lastCommitAt?: Date;
  public lastIssueCreatedAt?: Date;
  public lastPrCreatedAt?: Date;
  public pushedAt?: Date;
  public lastActivityAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize Repo model
Repo.init(repoAttributes, {
  sequelize,
  ...repoModelOptions,
});

export default Repo;
