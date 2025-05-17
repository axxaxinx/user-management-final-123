const bcrypt = require('bcryptjs');
const db = require('../_helpers/db');
const { Op } = require('sequelize');
const departmentService = require('../departments/department.service');
const workflowService = require('../workflows/workflow.service');

module.exports = {
  create,
  getAll,
  getById,
  update,
  verifyEmployeeStatus,
  transferEmployeeToDepartment
};

async function create(params) {
  const { userId, employeeId, position, hireDate, departmentId } = params;

  if (await db.Employee.findOne({ where: { employeeId } })) {
    throw 'Employee ID "' + employeeId + '" is already taken';
  }

  if (!await db.Account.findByPk(userId)) {
    throw 'User not found';
  }

  if (!await db.Department.findByPk(departmentId)) {
    throw 'Department not found';
  }

  const employee = await db.Employee.create({
    employeeId,
    userId,
    position,
    hireDate,
    departmentId,
    status: 'Active'
  });

  return employee;
}

async function getAll() {
  return await db.Employee.findAll({
    include: [
      { model: db.Account, as: 'user', attributes: ['id', 'email', 'firstName', 'lastName'] },
      { model: db.Department, as: 'department', attributes: ['id', 'name'] }
    ]
  });
}

async function getById(id) {
  const employee = await db.Employee.findByPk(id, {
    include: [
      { model: db.Account, as: 'user', attributes: ['id', 'email', 'firstName', 'lastName'] },
      { model: db.Department, as: 'department', attributes: ['id', 'name'] }
    ]
  });
  if (!employee) throw 'Employee not found';
  return employee;
}

async function update(id, params) {
  const employee = await getById(id);

  if (params.employeeId && params.employeeId !== employee.employeeId) {
    if (await db.Employee.findOne({ where: { employeeId: params.employeeId } })) {
      throw 'Employee ID "' + params.employeeId + '" is already taken';
    }
  }

  if (params.userId && !(await db.Account.findByPk(params.userId))) {
    throw 'User not found';
  }

  if (params.departmentId && !(await db.Department.findByPk(params.departmentId))) {
    throw 'Department not found';
  }

  Object.assign(employee, params);
  await employee.save();

  return employee;
}

async function verifyEmployeeStatus(id) {
  const employee = await getById(id);
  if (employee.status !== 'Active') {
    throw 'Employee is not active';
  }
  // Ensure employee has a valid user association
  if (!employee.user) {
    throw 'Employee is not associated with a valid user';
  }
  return employee;
}

async function transferEmployeeToDepartment(id, newDepartmentId) {
  // Step 1: Fetch the employee
  const employee = await getById(id);

  // Step 2: Validate the new department via department.service
  const newDepartment = await departmentService.getById(newDepartmentId);
  if (!newDepartment) {
    throw 'New department not found';
  }

  // Step 3: Update the employee's department
  const oldDepartmentId = employee.departmentId;
  employee.departmentId = newDepartmentId;
  await employee.save();

  // Step 4: Log the transfer as a workflow via workflow.service
  const workflow = await workflowService.create({
    employeeId: id,
    type: 'DepartmentChange',
    details: {
      oldDepartmentId,
      newDepartmentId,
      oldDepartmentName: employee.department ? employee.department.name : 'N/A',
      newDepartmentName: newDepartment.name,
      transferDate: new Date().toISOString()
    }
  });

  return {
    employee: await getById(id), // Refresh employee data with associations
    workflow
  };
}