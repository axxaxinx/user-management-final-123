const express = require('express');
const router = express.Router();
const Joi = require('joi');
const validateRequest = require('../_middleware/validate-request');
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');
const employeeService = require('./employee.service');

router.post('/', authorize(Role.Admin), createSchema, create);
router.get('/', authorize(), getAll);
router.get('/:id', authorize(), getById);
router.put('/:id', authorize(Role.Admin), updateSchema, update);
router.post('/:id/transfer', authorize(Role.Admin), transferSchema, transfer);

module.exports = router;

function createSchema(req, res, next) {
  const schema = Joi.object({
    employeeId: Joi.string().required(),
    userId: Joi.number().required(),
    position: Joi.string().required(),
    hireDate: Joi.date().required(),
    departmentId: Joi.number().required()
  });
  validateRequest(req, next, schema);
}

function create(req, res, next) {
  employeeService.create(req.body)
    .then(employee => res.json(employee))
    .catch(next);
}

function getAll(req, res, next) {
  employeeService.getAll()
    .then(employees => res.json(employees))
    .catch(next);
}

function getById(req, res, next) {
  employeeService.getById(req.params.id)
    .then(employee => employee ? res.json(employee) : res.sendStatus(404))
    .catch(next);
}

function updateSchema(req, res, next) {
  const schema = Joi.object({
    employeeId: Joi.string().optional(),
    userId: Joi.number().optional(),
    position: Joi.string().optional(),
    hireDate: Joi.date().optional(),
    departmentId: Joi.number().optional(),
    status: Joi.string().valid('Active', 'Inactive').optional()
  });
  validateRequest(req, next, schema);
}

function update(req, res, next) {
  employeeService.update(req.params.id, req.body)
    .then(employee => res.json(employee))
    .catch(next);
}

function transferSchema(req, res, next) {
  const schema = Joi.object({
    newDepartmentId: Joi.number().required()
  });
  validateRequest(req, next, schema);
}

function transfer(req, res, next) {
  employeeService.transferEmployeeToDepartment(req.params.id, req.body.newDepartmentId)
    .then(result => res.json(result))
    .catch(next);
}