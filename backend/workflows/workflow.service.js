const db = require('../_helpers/db');

module.exports = {
  create,
  getByEmployeeId,
  updateStatus,
  initiateEmployeeOnboarding
};

async function create(params) {
  const { employeeId, type, details } = params;

  if (!await db.Employee.findByPk(employeeId)) {
    throw 'Employee not found';
  }

  const workflow = await db.Workflow.create({
    employeeId,
    type,
    details,
    status: 'Pending'
  });

  return workflow;
}

async function getByEmployeeId(employeeId) {
  return await db.Workflow.findAll({
    where: { employeeId },
    include: [{ model: db.Employee, as: 'employee', attributes: ['id', 'employeeId'] }]
  });
}

async function updateStatus(id, status) {
  const workflow = await db.Workflow.findByPk(id);
  if (!workflow) throw 'Workflow not found';

  workflow.status = status;
  await workflow.save();
  return workflow;
}

async function initiateEmployeeOnboarding(params) {
  const { employeeId, departmentId, onboardingTasks } = params;

  // Step 1: Verify employee status via employee.service
  const employee = await employeeService.verifyEmployeeStatus(employeeId);

  // Step 2: Assign department via department.service
  const { department } = await departmentService.assignDepartment(employeeId, departmentId);

  // Step 3: Create onboarding workflow
  const workflow = await create({
    employeeId,
    type: 'Onboarding',
    details: {
      tasks: onboardingTasks || ['Setup email', 'Assign workstation'],
      department: department.name
    }
  });

  return {
    employee,
    department,
    workflow
  };
}