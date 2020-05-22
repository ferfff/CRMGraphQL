const { ApolloServer } = require('apollo-server');
const typeDefs = require('./db/schema');
const resolvers = require('./db/resolvers');
const connectDB = require('./config/db');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'vars.env' });

//Connect
connectDB();

// server
const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({req}) => {
        //console.log(req.headers);

        const token = req.headers['authorization'] || '';
        if (token) {
            try {
                const user = jwt.verify(token.replace('Bearer ',''), process.env.SECRET);
                console.log(user);
                return {
                    user
                }
            } catch (e) {
                console.log('Error', e);
            }
        }
    }
});

server.listen().then( ({url}) => {
    console.log(`Server running in ${url}`);
})
