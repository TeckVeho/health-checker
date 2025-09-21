// src/features/alert/alertModel.ts

import { Model } from 'sequelize';
import sequelize from '../../config/database';
import { 
  AlertAttributes, 
  AlertCreationAttributes, 
  alertAttributes, 
  alertModelOptions 
} from './alertSchema';

// Model definition
class Alert extends Model<AlertAttributes, AlertCreationAttributes> implements AlertAttributes {
  public id!: number;
  public owner!: string;
  public repo!: string;
  public checkType!: string;
  public title!: string;
  public description?: string;
  public severity?: string;
  public author?: string;
  public authorDisplayName?: string;
  public filePath?: string;
  public lineNumber?: number;
  public codeSnippet?: string;
  public branch?: string;
  public detectCount!: number;
  public lastDetectedAt?: Date;
  public isIgnored!: boolean;
  public ignoreReason?: string;
  public manualResolved!: boolean;
  public manualResolvedReason?: string;
  public systemResolved!: boolean;
  public systemResolvedReason?: string;
  public issueUrl?: string;
  public notes?: string;
  public createdAt?: Date;
}

Alert.init(alertAttributes, {
  sequelize,
  ...alertModelOptions,
});



export default Alert;
