// Alert モデルのモック
const mockAlert = {
  findAll: jest.fn().mockResolvedValue([]),
  findOne: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockResolvedValue({}),
  update: jest.fn().mockResolvedValue([1]),
  destroy: jest.fn().mockResolvedValue(1),
  count: jest.fn().mockResolvedValue(0),
  aggregate: jest.fn().mockResolvedValue(0),
  sync: jest.fn().mockResolvedValue(undefined),
  drop: jest.fn().mockResolvedValue(undefined),
  bulkCreate: jest.fn().mockResolvedValue([]),
  findOrCreate: jest.fn().mockResolvedValue([{}, true]),
};

export default mockAlert;
