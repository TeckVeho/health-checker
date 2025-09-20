module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('Fixing null lastDetectedAt values...');
    
    // lastDetectedAtがnullのレコードをcreatedAtで更新
    await queryInterface.sequelize.query(`
      UPDATE alerts 
      SET last_detected_at = created_at 
      WHERE last_detected_at IS NULL;
    `);
    
    console.log('Fixed null lastDetectedAt values');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('This migration cannot be reverted as it fixes data integrity issues');
  }
};
