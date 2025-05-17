const express = require('express');
const router = express.Router();
const Joi = require('joi');
const validateRequest = require('../_middleware/validate-request');
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');
const workflowService = require('./workflow.service');

router.post('/', authorize(Role.Admin), createSchema, create);
router.get('/employee/:employeeId', authorize(), getByEmployeeId);
router.put('/:id/status', authorize(Role.Admin), updateStatusSchema, updateStatus);
router.post('/onboarding', authorize(Role.Admin), onboardingSchema, initiateOnboarding);

module.exports = router;

function createSchema(req, res, next) {
  const schema = Joi.object({
    employeeId: Joi.number().required(),
    type: Joi.string().valid('Onboarding', 'DepartmentChange', 'Termination').required(),
    details: Joi.string().allow('').optional() //changed to allow string input
  });
  validateRequest(req, next, schema);
}

function create(req, res, next) {
  workflowService.create(req.body)
    .then(workflow => res.json(workflow))
    .catch(next);
}

function getByEmployeeId(req, res, next) {
  workflowService.getByEmployeeId(req.params.employeeId)
    .then(workflows => res.json(workflows))
    .catch(next);
}

function updateStatusSchema(req, res, next) {
  const schema = Joi.object({
    status: Joi.string().valid('Pending', 'Approved', 'Rejected').required()
  });
  validateRequest(req, next, schema);
}

function updateStatus(req, res, next) {
  workflowService.updateStatus(req.params.id, req.body.status)
    .then(workflow => res.json(workflow))
    .catch(next);
}

function onboardingSchema(req, res, next) {
  const schema = Joi.object({
    employeeId: Joi.number().required(),
    departmentId: Joi.number().required(),
    onboardingTasks: Joi.array().items(Joi.string()).optional()
  });
  validateRequest(req, next, schema);
}

function initiateOnboarding(req, res, next) {
  workflowService.initiateEmployeeOnboarding(req.body)
    .then(result => res.json(result))
    .catch(next);
}