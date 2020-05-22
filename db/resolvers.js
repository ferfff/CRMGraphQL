const User = require('../models/User');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Order = require('../models/Order');

const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'vars.env' });

const createToken = (user, secret, expiresIn) => {
    console.log(user);
    const {id, email, name, lastName} = user;
    return jwt.sign({ id, email, name, lastName }, secret, { expiresIn });
}

// Resolvers
const resolvers = {
    Query: {
        getUser: async (_, {}, ctx) => {
            return ctx.user;
        },
        getProducts: async () => {
            try {
                const products = await Product.find({});

                return products;
            } catch (e) {
                console.log(e);
            }
        },
        getProduct: async (_, {id}) => {
            try {
                const product = await Product.findById(id);
                if(!product) {
                    throw new Error('Product not found');
                }
                return product;
            } catch (e) {
                console.log(e);
            }
        },
        getCustomers: async () => {
            try {
                const customers = await Customer.find({});

                return customers;
            } catch (e) {
                console.log(e);
            }
        },
        getCustomerSeller: async (_, {}, ctx) => {
            try {
                const customers = await Customer.find({ seller: ctx.user.id.toString()});

                return customers;
            } catch (e) {
                console.log(e);
            }
        },
        getCustomer: async (_, { id }, ctx) => {
            // Exists
            const customer = await Customer.findById(id);
            if (!customer) {
                throw new Error('Customer does not exist');
            }

            // Verify customer -> seller relationship
            if(customer.seller.toString() !== ctx.user.id){
                throw new Error('Not authorized');
            }

            return customer;
        },
        getOrders: async () => {
            try {
                const orders = await Order.find({});

                return orders;
            } catch (e) {
                console.log(e);
            }
        },
        getOrderBySeller: async (_, {}, ctx) => {
            try {
                const orders = await Order.find({ seller: ctx.user.id });

                return orders;
            } catch (e) {
                console.log(e);
            }
        },
        getOrders: async () => {
            try {
                const orders = await Order.find({});

                return orders;
            } catch (e) {
                console.log(e);
            }
        },
        getOrder: async (_, {id}, ctx) => {
            const order = await Order.findById(id);
            if (!order) {
                throw new Error('Order does not exist');
            }

            // Verify customer -> seller relationship
            if(order.seller.toString() !== ctx.user.id){
                throw new Error('Not authorized');
            }

            return order;
        },
        getOrderByStatus: async (_, {status}, ctx) => {
            const orders = await Order.find({ seller: ctx.user.id, status});

            return orders;
        },
        getTopCustomers: async () => {
            const customers = await Order.aggregate([
                { $match : { status : "COMPLETED" } },
                { $group : {
                    _id : "$customer",
                    total: { $sum: '$total' }
                }},
                { $lookup: {
                    from: "customers",
                    localField: "_id",
                    foreignField: "_id",
                    as: "customers"
                } },
                { $limit: 5 },
                { $sort : { total : -1 } }
            ]);

            return customers;
        },
        getTopSellers : async () => {
            const sellers = await Order.aggregate([
                { $match : { status : "COMPLETED" } },
                { $group : {
                    _id : "$seller", // Name in type Order
                    total: { $sum: '$total' }
                }},
                { $lookup: {
                    from: 'users', // Name real in collection in plural
                    localField: '_id',
                    foreignField: '_id',
                    as: 'sellers' // Name in type TopSeller
                } },
                { $limit: 5 },
                { $sort : { total : -1 } }
            ]);

            return sellers;
        },
        getProductsBySearch: async (_, {text}, ctx) => {
            const products = await Product.find({ $text: {$search: text} }).limit(5);

            return products;
        }
    },
    Mutation: {
        newUser: async (_, {input} ) => {

            const { email, password } = input;
            // User registered
            const userExists = await User.findOne({email});
            if(userExists) {
                throw new Error('User already exists');
            }
            // Hashing pass
            const salt = await bcryptjs.genSalt(10);
            input.password = await bcryptjs.hash(password, salt);

            // Save in DB
            try {
                const user = new User(input);
                user.save();
                return user;
            } catch (e) {
                console.log('error',e);
            }
        },
        newProduct: async (_, {input} ) => {
            try {
                const product = new Product(input);
                const result = await product.save();
                return result;
            } catch (e) {
                console.log('error',e);
            }
        },
        updateProduct: async (_, {id, input} ) => {
            let product = await Product.findById(id);
            if(!product) {
                throw new Error('Product not found');
            }

            try {
                product = Product.findOneAndUpdate({ _id: id }, input, { new:true });
                return product;
            } catch (e) {
                console.log('error',e);
            }
        },
        deleteProduct: async (_, {id}) => {
            let product = await Product.findById(id);
            if(!product) {
                throw new Error('Product not found');
            }
            await Product.findOneAndDelete({_id:id});

            return "Product deleted";
        },
        newCustomer: async (_, {input}, ctx) => {
            console.log(ctx);
            const { email } = input;
            //Verify customer userExists
            const customer = await Customer.findOne( {email} );

            if (customer) {
                throw new Error('Customer already registered');
            }

            const newCustomer = new Customer(input);
            newCustomer.seller = ctx.user.id;

            try {
                const result = await newCustomer.save();
                return result;
            } catch (e) {
                console.log(e);
            }
            return 'Customer created';
        },
        updateCustomer: async (_, {id, input}, ctx ) => {
            let customer = await Customer.findById(id);
            if(!customer) {
                throw new Error('Customer not found');
            }

            // Verify customer -> seller relationship
            if(customer.seller.toString() !== ctx.user.id){
                throw new Error('Update not authorized');
            }

            try {
                customer = Customer.findOneAndUpdate({ _id: id }, input, { new:true });
                return customer;
            } catch (e) {
                console.log('error',e);
            }
        },
        deleteCustomer: async (_, {id}, ctx ) => {
            let customer = await Customer.findById(id);
            if(!customer) {
                throw new Error('Customer not found');
            }

            // Verify customer -> seller relationship
            if(customer.seller.toString() !== ctx.user.id){
                throw new Error('Delete not authorized');
            }

            await Customer.findOneAndDelete({_id:id});
            return "Customer deleted";
        },
        newOrder: async (_, {input}, ctx ) => {
            const { customer } = input;

            // Customer exists
            let customerExists = await Customer.findById(customer);
            if(!customerExists) {
                throw new Error('Customer not found');
            }

            // Verify customer -> seller relationship
            if(customerExists.seller.toString() !== ctx.user.id){
                throw new Error('Not authorized');
            }

            // Stock available
            for await (const item of input.order) {
                const { id } = item;

                const product = await Product.findById(id);

                if (item.quantity > product.stock) {
                    throw new Error(`You are asking for more ${product.name} that exists`);
                } else {
                    product.stock = product.stock - item.quantity;

                    await product.save();
                }
            }

            // Crete new order
            const newOrder = new Order(input);

            // Assign seller
            newOrder.seller = ctx.user.id;

            //Save in DB
            const result = await newOrder.save();
            return result;
        },
        updateOrder: async (_, {id, input}, ctx ) => {
            const { customer } = input;

            const order = await Order.findById(id);
            if (!order) {
                throw new Error('Order does not exist');
            }

            const customerExists = await Customer.findById(customer);
            if (!customerExists) {
                throw new Error('Customer does not exist');
            }

            // Verify customer -> seller relationship
            if(customerExists.seller.toString() !== ctx.user.id){
                throw new Error('Not authorized');
            }

            // Check stock
            if(input.order){
                for await (const item of input.order) {
                    const { id } = item;

                    const product = await Product.findById(id);

                    if (item.quantity > product.stock) {
                        throw new Error(`You are asking for more ${product.name} that exists`);
                    } else {
                        product.stock = product.stock - item.quantity;

                        await product.save();
                    }
                }
            }

            //Save order
            const result = await Order.findOneAndUpdate({_id: id}, input, {new:true});
            return result;
        },
        deleteOrder: async (_, {id}, ctx) => {
            const order = await Order.findById(id);
            if (!order) {
                throw new Error('Order does not exist');
            }

            // Verify customer -> seller relationship
            if(order.seller.toString() !== ctx.user.id){
                throw new Error('Delete action not authorized');
            }

            await Order.findOneAndDelete({_id:id});
            return "Order deleted";
        },
        authenticateUser: async (_, {input} ) => {
            const { email, password } = input;
            //Verify user userExists
            const userExists = await User.findOne({email});
            if(!userExists) {
                throw new Error('User does not exist');
            }

            //Check if password is correct
            const correctPass = await bcryptjs.compare(password, userExists.password);
            if (!correctPass) {
                throw new Error('Incorrect password');
            }

            //Create token
            return {
                token: createToken(userExists, process.env.SECRET, '24h')
            }
        }
    }
}

module.exports = resolvers;
