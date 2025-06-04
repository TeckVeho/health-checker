import sequelize from '@config/database';

describe('Database Connection', () => {
  it('should successfully connect to the database', async () => {
    await expect(sequelize.authenticate()).resolves.not.toThrow();
  });

  afterAll(async () => {
    await sequelize.close();
  });
});
