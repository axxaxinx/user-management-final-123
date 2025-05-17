const { expressjwt } = require('express-jwt');
const config = require('../config'); // Use the centralized config
const db = require('../_helpers/db');

module.exports = authorize;

function authorize(roles = []) {
    // roles param can be a single role string (e.g. Role.User or 'User') 
    // or an array of roles (e.g. [Role.Admin, Role.User] or ['Admin', 'User'])
    if (typeof roles === 'string') {
        roles = [roles];
    }

    // Ensure config.secret is loaded correctly
    if (!config.secret) {
        console.error("FATAL ERROR: JWT_SECRET is not set in the environment variables or config.");
        process.exit(1);
    }

    return [
        // authenticate JWT token and attach user to request object (req.user)
        // Use expressjwt({ config }) to CREATE the middleware
        expressjwt({ secret: config.secret, algorithms: ['HS256'] }),

        // 2. Authorize based on user role and attach full user object to req.user
        async (req, res, next) => {
            try { // Good practice to wrap async operations in try...catch
                // Check if req.auth exists (it should if expressjwt succeeded)
                if (!req.auth || !req.auth.id) {
                    // This case should ideally not happen if JWT is valid and contains id
                    console.error('Authorization Error: req.auth or req.auth.id missing after JWT validation.');
                    return res.status(401).json({ message: 'Unauthorized' });
                }

                // Fetch the full account details from DB using the ID from the token payload (req.auth.id)
                const account = await db.Account.findByPk(req.auth.id); // <-- Use req.auth.id here

                if (!account) {
                    // Account associated with token no longer exists in DB
                    return res.status(401).json({ message: 'Unauthorized' });
                }

                if (roles.length && !roles.includes(account.role)) {
                    // Account exists but role is not authorized for this route
                    return res.status(401).json({ message: 'Unauthorized' });
                }

                // Authentication and authorization successful.
                // Attach the fetched account object (or its plain version) to req.user for downstream use.
                req.user = account.get(); // Use .get() for a plain JS object if needed by other parts

                // Attach helper methods like ownsToken to the newly populated req.user
                const refreshTokens = await account.getRefreshTokens(); // Use the fetched account instance
                req.user.ownsToken = token => !!refreshTokens.find(x => x.token === token);

                // Proceed to the next middleware or route handler
                next();

            } catch (error) {
                // Pass any database or other unexpected errors to the global error handler
                next(error);
            }
        }
    ];
}