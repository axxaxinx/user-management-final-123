const db = require('../_helpers/db');

module.exports = {
  create,
  getAll,
  getById,
  update,
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
  return await db.Department.findAll({
    attributes: [
    'id', 'name', 'description',
    [db.sequelize.fn('COUNT', db.sequelize.col('employees.id')), 'employeeCount']
  ],
  include: [{
    model: db.Employee,
    as: 'employees',
    attributes: []
  }],
  group: ['Department.id']
  });
}

async function getById(id) {
  const department = await db.Department.findByPk(id);
  if (!department) throw 'Department not found';
  return department;
}

async function update(id, params) {
  const department = await getById(id);

  if (params.name && params.name !== department.name) {
    if (await db.Department.findOne({ where: { name: params.name } })) {
      throw 'Department "' + params.name + '" already exists';
    }
  }

  Object.assign(department, params);
  await department.save();
  return department;
}

async function assignDepartment(employeeId, departmentId) {
  const employee = await db.Employee.findByPk(employeeId);
  if (!employee) throw 'Employee not found';

  const department = await getById(departmentId);
  if (!department) throw 'Department not found';

  employee.departmentId = departmentId;
  await employee.save();
  return { employee, department };
}