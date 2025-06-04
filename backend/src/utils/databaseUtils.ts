import { DataType } from 'sequelize';

type AttributeOptions = {
  type: DataType;
  allowNull?: boolean;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  unique?: boolean | { name: string };
  validate?: Record<string, unknown>;
};

/**
 * A generic function to extract unique index settings from model attributes
 * @param attributes - Attribute object of any model
 * @returns An array of objects defining unique indexes
 */
export function mapUniqueIndexes(attributes: Record<string, AttributeOptions>) {
  const indexes = [];

  for (const [key, value] of Object.entries(attributes)) {
    if (typeof value === 'object' && 'unique' in value && value.unique) {
      const indexName = typeof value.unique === 'object' && 'name' in value.unique ? value.unique.name : `${key}_unique_index`;

      indexes.push({
        unique: true,
        fields: [key],
        name: indexName,
      });
    }
  }
  return indexes;
}
