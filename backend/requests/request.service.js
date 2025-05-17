const db = require('../_helpers/db');

module.exports = {
    create,
    getAll,
    getById,
    getByEmployeeId,
    update,
    delete: _delete,
    addItem,
    deleteItem
};

async function create(params) {
    const request = new db.Request({
        type: params.type,
        description: params.description,
        employeeId: params.employeeId
    });

    // Save the request first
    const savedRequest = await request.save();

    // Create items if provided
    if (params.items && params.items.length > 0) {
        const items = params.items.map(item => ({
            ...item,
            requestId: savedRequest.id
        }));
        await db.RequestItem.bulkCreate(items);
    }

    // Create a workflow entry for the request
    await db.Workflow.create({
        type: `${params.type}Request`,
        status: 'Pending',
        employeeId: params.employeeId,
        requestId: savedRequest.id,
        details: `New ${params.type} request created`
    });

    // Return request with items
    return getById(savedRequest.id);
}

async function getAll() {
    return await db.Request.findAll({
        include: [
            { 
                model: db.RequestItem,
                as: 'items'
            },
            {
                model: db.Employee,
                as: 'employee',
                include: [{
                    model: db.Account,
                    as: 'user',
                    attributes: ['firstName', 'lastName', 'email']
                }]
            }
        ]
    });
}

async function getById(id) {
    return await db.Request.findByPk(id, {
        include: [
            { 
                model: db.RequestItem,
                as: 'items'
            },
            {
                model: db.Employee,
                as: 'employee',
                include: [{
                    model: db.Account,
                    as: 'user',
                    attributes: ['firstName', 'lastName', 'email']
                }]
            }
        ]
    });
}

async function getByEmployeeId(employeeId) {
    return await db.Request.findAll({
        where: { employeeId },
        include: [
            { 
                model: db.RequestItem,
                as: 'items'
            }
        ]
    });
}

async function update(id, params) {
    const request = await getById(id);
    
    // Update request
    Object.assign(request, params);
    await request.save();

    // If status is updated, create a workflow entry
    if (params.status) {
        await db.Workflow.create({
            type: `${request.type}Request`,
            status: params.status,
            employeeId: request.employeeId,
            requestId: request.id,
            details: `Request ${params.status.toLowerCase()}`
        });
    }

    return request;
}

async function _delete(id) {
    const request = await getById(id);
    
    // Delete associated workflow entries
    await db.Workflow.destroy({
        where: { requestId: id }
    });

    // Request items will be automatically deleted due to CASCADE
    await request.destroy();
}

async function addItem(requestId, itemParams) {
    const item = new db.RequestItem({
        ...itemParams,
        requestId
    });
    return await item.save();
}

async function deleteItem(requestId, itemId) {
    return await db.RequestItem.destroy({
        where: {
            id: itemId,
            requestId: requestId
        }
    });
}