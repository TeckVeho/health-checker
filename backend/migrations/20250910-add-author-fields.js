'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add author field to alerts table
    await queryInterface.addColumn('alerts', 'author', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'GitHub username of issue author'
    });

    // Add author display name field
    await queryInterface.addColumn('alerts', 'author_display_name', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Display name of issue author'
    });

    // Add index for author field for efficient queries
    await queryInterface.addIndex('alerts', ['author'], {
      name: 'idx_alerts_author'
    });

    // Add composite index for author and severity
    await queryInterface.addIndex('alerts', ['author', 'severity'], {
      name: 'idx_alerts_author_severity'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    await queryInterface.removeIndex('alerts', 'idx_alerts_author_severity');
    await queryInterface.removeIndex('alerts', 'idx_alerts_author');
    
    // Remove columns
    await queryInterface.removeColumn('alerts', 'author_display_name');
    await queryInterface.removeColumn('alerts', 'author');
  }
};