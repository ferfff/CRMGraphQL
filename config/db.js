const mongoose = require('mongoose');
require('dotenv').config({ path: 'vars.env' });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB_MONGO, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
            useCreateIndex: true
        });
        console.log('DB connected');
    } catch (e) {
        console.log('Error in connection',e);
        process.exit(1);
    } finally {

    }
}

module.exports = connectDB;
