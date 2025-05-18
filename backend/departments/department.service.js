const db = require('../_helpers/db');
const { QueryTypes } = require('sequelize');

module.exports = {
  create,
  getAll,
  getById,
  update,
  delete: _delete,
  assignDepartment
};

async function create(params) {
  if (await db.Department.findOne({ where: { name: params.name } })) {
    throw 'Department "' + params.name + '" already exists';
  }

  const department = await db.Department.create(params);
  return department;
}

async function getAll() {
  try {
    // Get all departments with employee count using a raw query
    const departments = await db.Department.findAll({
      include: [{
        model: db.Employee,
        as: 'employees',
        attributes: []
      }],
      attributes: [
        'id',
        'name',
        'description',
        'createdAt',
        'updatedAt',
        [db.Department.sequelize.fn('COUNT', db.Department.sequelize.col('employees.id')), 'employeeCount']
      ],
      group: ['Department.id', 'Department.name', 'Department.description', 'Department.createdAt', 'Department.updatedAt']
    });

    return departments.map(dept => {
      const plainDept = dept.get({ plain: true });
      return {
        ...plainDept,
        employeeCount: parseInt(plainDept.employeeCount) || 0
      };
    });
  } catch (error) {
    console.error('Error in getAll departments:', error);
    throw error;
  }
}

async function getById(id) {
  const department = await getDepartment(id);
  return department;
}

async function update(id, params) {
  const department = await getDepartment(id);

  if (params.name && params.name !== department.name) {
    if (await db.Department.findOne({ where: { name: params.name } })) {
      throw 'Department "' + params.name + '" already exists';
    }
  }

  Object.assign(department, params);
  await department.save();
  return department;
}

async function _delete(id) {
  const department = await getDepartment(id);
  await department.destroy();
}

async function assignDepartment(employeeId, departmentId) {
  const employee = await db.Employee.findByPk(employeeId);
  if (!employee) throw 'Employee not found';

  const department = await getDepartment(departmentId);
  if (!department) throw 'Department not found';

  employee.departmentId = departmentId;
  await employee.save();
  return { employee, department };
}

// helper functions
async function getDepartment(id) {
  const department = await db.Department.findByPk(id);
  if (!department) throw 'Department not found';
  return department;
}