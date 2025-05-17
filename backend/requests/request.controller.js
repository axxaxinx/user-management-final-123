const express = require('express');
const router = express.Router();
const Joi = require('joi');
const validateRequest = require('../_middleware/validate-request');
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');
const requestService = require('./request.service');

// routes
router.post('/', authorize(), createSchema, create);
router.get('/', authorize(), getAll);
router.get('/my-requests', authorize(), getMyRequests);
router.get('/:id', authorize(), getById);
router.put('/:id', authorize(), updateSchema, update);
router.delete('/:id', authorize(), _delete);
router.post('/:id/items', authorize(), addItemSchema, addItem);
router.delete('/:requestId/items/:itemId', authorize(), deleteItem);

module.exports = router;

// route functions

function getAll(req, res, next) {
    // Only admins can see all requests
    if (req.user.role !== Role.Admin) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    requestService.getAll()
        .then(requests => res.json(requests))
        .catch(next);
}

function getMyRequests(req, res, next) {
    requestService.getByEmployeeId(req.user.employee.id)
        .then(requests => res.json(requests))
        .catch(next);
}

function getById(req, res, next) {
    // Users can only view their own requests unless they're an admin
    requestService.getById(req.params.id)
        .then(request => {
            if (!request) return res.sendStatus(404);
            if (request.employeeId !== req.user.employee.id && req.user.role !== Role.Admin) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            res.json(request);
        })
        .catch(next);
}

function create(req, res, next) {
    // Add employeeId from the authenticated user's employee record
    req.body.employeeId = req.user.employee.id;
    requestService.create(req.body)
        .then(request => res.json(request))
        .catch(next);
}

function update(req, res, next) {
    // Only admins can update status, users can only update their own request descriptions
    requestService.getById(req.params.id)
        .then(request => {
            if (!request) return res.sendStatus(404);
            if (req.body.status && req.user.role !== Role.Admin) {
                return res.status(401).json({ message: 'Only admins can update request status' });
            }
            if (request.employeeId !== req.user.employee.id && req.user.role !== Role.Admin) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            requestService.update(req.params.id, req.body)
                .then(request => res.json(request))
                .catch(next);
        })
        .catch(next);
}

function _delete(req, res, next) {
    // Users can only delete their pending requests, admins can delete any
    requestService.getById(req.params.id)
        .then(request => {
            if (!request) return res.sendStatus(404);
            if (request.employeeId !== req.user.employee.id && req.user.role !== Role.Admin) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            if (request.status !== 'Pending' && req.user.role !== Role.Admin) {
                return res.status(400).json({ message: 'Can only delete pending requests' });
            }
            requestService.delete(req.params.id)
                .then(() => res.json({ message: 'Request deleted successfully' }))
                .catch(next);
        })
        .catch(next);
}

// schema functions

function createSchema(req, res, next) {
    const schema = Joi.object({
        type: Joi.string().valid('Equipment', 'Leave', 'Resources').required(),
        description: Joi.string().allow(null, ''),
        items: Joi.array().items(
            Joi.object({
                name: Joi.string().required(),
                quantity: Joi.number().integer().min(1).required(),
                details: Joi.string().allow(null, '')
            })
        ).required()
    });
    validateRequest(req, next, schema);
}

function updateSchema(req, res, next) {
    const schema = Joi.object({
        status: Joi.string().valid('Pending', 'Approved', 'Rejected').required(),
        description: Joi.string().allow(null, '')
    });
    validateRequest(req, next, schema);
}

function addItemSchema(req, res, next) {
    const schema = Joi.object({
        name: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
        details: Joi.string().allow(null, '')
    });
    validateRequest(req, next, schema);
}

function addItem(req, res, next) {
    requestService.getById(req.params.id)
        .then(request => {
            if (!request) return res.sendStatus(404);
            if (request.employeeId !== req.user.employee.id && req.user.role !== Role.Admin) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            if (request.status !== 'Pending') {
                return res.status(400).json({ message: 'Can only add items to pending requests' });
            }
            requestService.addItem(req.params.id, req.body)
                .then(item => res.json(item))
                .catch(next);
        })
        .catch(next);
}

function deleteItem(req, res, next) {
    requestService.getById(req.params.requestId)
        .then(request => {
            if (!request) return res.sendStatus(404);
            if (request.employeeId !== req.user.employee.id && req.user.role !== Role.Admin) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            if (request.status !== 'Pending') {
                return res.status(400).json({ message: 'Can only delete items from pending requests' });
            }
            requestService.deleteItem(req.params.requestId, req.params.itemId)
                .then(() => res.json({ message: 'Item deleted successfully' }))
                .catch(next);
        })
        .catch(next);
}