import User from '../domain/repo/repoModel';
import Role from '../domain/role/roleModel';
import UserRole from '../domain/repo/userRoleModel';

let associationsInitialized = false;

export default function setupAssociations() {
  if (associationsInitialized) {
    return;
  }

  User.belongsToMany(Role, {
    through: UserRole,
    as: 'roles',
    foreignKey: 'userId',
  });

  Role.belongsToMany(User, {
    through: UserRole,
    as: 'users',
    foreignKey: 'roleId',
  });

  associationsInitialized = true;
}
