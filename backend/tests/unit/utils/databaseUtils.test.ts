// src/utils/databaseUtils.test.ts

import { mapUniqueIndexes } from '@utils/databaseUtils';

describe('mapUniqueIndexes', () => {
  it('should return an empty array if no unique constraints are defined', () => {
    const attributes = {
      id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
      name: { type: 'STRING', allowNull: false },
    };

    const result = mapUniqueIndexes(attributes);
    expect(result).toEqual([]);
  });

  it('should return unique indexes for attributes with unique constraints', () => {
    const attributes = {
      id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
      email: { type: 'STRING', allowNull: false, unique: true },
      username: { type: 'STRING', unique: { name: 'unique_username' } },
    };

    const result = mapUniqueIndexes(attributes);

    expect(result).toEqual([
      { unique: true, fields: ['email'], name: 'email_unique_index' },
      { unique: true, fields: ['username'], name: 'unique_username' },
    ]);
  });

  it('should generate default index name if unique constraint is boolean', () => {
    const attributes = {
      email: { type: 'STRING', allowNull: false, unique: true },
    };

    const result = mapUniqueIndexes(attributes);

    expect(result).toEqual([{ unique: true, fields: ['email'], name: 'email_unique_index' }]);
  });

  it('should generate specified index name if unique constraint is an object', () => {
    const attributes = {
      username: { type: 'STRING', unique: { name: 'custom_username_index' } },
    };

    const result = mapUniqueIndexes(attributes);

    expect(result).toEqual([{ unique: true, fields: ['username'], name: 'custom_username_index' }]);
  });
});
