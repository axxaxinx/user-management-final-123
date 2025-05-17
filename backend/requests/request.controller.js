const express = require('express');
const router = express.Router();
const Joi = require('joi');
const validateRequest = require('../_middleware/validate-request');
const authorize = require('../_middleware/authorize');
const requestService = require('./request.service');

// routes
router.get('/', authorize(), getAll);
router.get('/:id', authorize(), getById);
router.post('/', authorize(), createSchema, create);
router.put('/:id', authorize(), updateSchema, update);
router.delete('/:id', authorize(), _delete);

module.exports = router;

// route functions

function getAll(req, res, next) {
    requestService.getAll()
        .then(requests => res.json(requests))
        .catch(next);
}

function getById(req, res, next) {
    requestService.getById(req.params.id)
        .then(request => res.json(request))
        .catch(next);
}

function create(req, res, next) {
    requestService.create(req.body)
        .then(request => res.json(request))
        .catch(next);
}

function update(req, res, next) {
    requestService.update(req.params.id, req.body)
        .then(request => res.json(request))
        .catch(next);
}

function _delete(req, res, next) {
    requestService.delete(req.params.id)
        .then(() => res.json({ message: 'Request deleted successfully' }))
        .catch(next);
}

// schema functions

function createSchema(req, res, next) {
    const schema = Joi.object({
        type: Joi.string().required(),
        employeeId: Joi.number().required(),
        items: Joi.array().items(
            Joi.object({
                name: Joi.string().required(),
                quantity: Joi.number().required()
            })
        ).required()
    });
    validateRequest(req, next, schema);
}

function updateSchema(req, res, next) {
    const schema = Joi.object({
        type: Joi.string().required(),
        employeeId: Joi.number().required(),
        status: Joi.string().required(),
        items: Joi.array().items(
            Joi.object({
                name: Joi.string().required(),
                quantity: Joi.number().required()
            })
        ).required()
    });
    validateRequest(req, next, schema);
}