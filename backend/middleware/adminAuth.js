const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });

    try {
        const bearerToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
        const decoded = jwt.verify(bearerToken, process.env.JWT_SECRET);
        
        if (decoded.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied. Requires Admin privileges.' });
        }
        
        req.user = decoded;
        next();
    } catch (ex) {
        res.status(400).json({ success: false, message: 'Invalid token.' });
    }
}
