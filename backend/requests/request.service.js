const db = require('../_helpers/db');

module.exports = {
    getAll,
    getById,
    create,
    update,
    delete: _delete
};

async function getAll() {
    const requests = await db.Request.findAll({
        include: [
            { 
                model: db.Employee, 
                as: 'employee',
                include: [{
                    model: db.Account,
                    as: 'user',
                    attributes: ['email', 'role']
                }]
            },
            {
                model: db.RequestItem,
                as: 'items'
            }
        ]
    });
    return requests;
}

async function getById(id) {
    const request = await getRequest(id);
    return request;
}

async function create(params) {
    // Create request
    const request = new db.Request({
        type: params.type,
        employeeId: params.employeeId,
        status: 'Pending' // Default status for new requests
    });
    
    // Save request to get the ID
    await request.save();

    // Process items if they exist
    if (params.items && params.items.length) {
        for (const item of params.items) {
            await db.RequestItem.create({
                requestId: request.id,
                name: item.name,
                quantity: item.quantity
            });
        }
    }

    return await getRequest(request.id);
}

async function update(id, params) {
    const request = await getRequest(id);
    
    // Update request attributes
    Object.assign(request, {
        type: params.type,
        employeeId: params.employeeId,
        status: params.status,
        updated: new Date()
    });
    
    await request.save();
    
    // Handle items
    if (params.items) {
        // Remove existing items
        await db.RequestItem.destroy({ where: { requestId: id } });
        
        // Add new items
        for (const item of params.items) {
            await db.RequestItem.create({
                requestId: request.id,
                name: item.name,
                quantity: item.quantity
            });
        }
    }
    
    return await getRequest(id);
}

async function _delete(id) {
    const request = await getRequest(id);
    
    // Delete request (cascade will delete items)
    await request.destroy();
}

// Helper function to get request with items
async function getRequest(id) {
    const request = await db.Request.findByPk(id, {
        include: [
            { 
                model: db.Employee, 
                as: 'employee',
                include: [{
                    model: db.Account,
                    as: 'user',
                    attributes: ['email', 'role']
                }]
            },
            {
                model: db.RequestItem,
                as: 'items'
            }
        ]
    });
    
    if (!request) throw 'Request not found';
    
    return request;
}