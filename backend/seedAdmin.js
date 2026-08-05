require('dotenv').config();
const sequelize = require('./db');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

sequelize.sync().then(async () => {
    try {
        const existingAdmin = await User.findOne({ where: { phone: 'admin' }});
        if (existingAdmin) {
            console.log('Admin user already exists!');
            process.exit(0);
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        
        await User.create({
            name: 'Super Admin',
            phone: 'admin',
            password: hashedPassword,
            role: 'admin'
        });
        
        console.log('Admin user seeded! Login with Phone: admin | Password: admin123');
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
});
