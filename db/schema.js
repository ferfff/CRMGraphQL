const { gql } = require('apollo-server');

//schema
const typeDefs = gql`
    type User {
        id: ID
        name: String
        lastName: String
        email: String
        created: String
    }

    type Token {
        token: String
    }

    type Product {
        id: ID
        name: String
        stock: Int
        price: Float
        created: String
    }

    type Customer {
        id: ID
        name: String
        lastName: String
        company: String
        email: String
        phone: String
        seller: ID
    }

    type Order {
        id: ID
        order: [OrderGroup]
        total: Float
        customer: ID
        seller: ID
        dateOf: String
        status: StatusOrder
    }

    type OrderGroup {
        id: ID
        quantity: Int
    }

    type TopCustomer {
        total: Float
        customers: [Customer]
    }

    type TopSeller {
        total: Float
        sellers: [User]
    }

    input UserInput {
        name: String!
        lastName: String!
        email: String!
        password: String!
    }

    input AuthenticateInput {
        email: String!
        password: String!
    }

    input ProductInput {
        name: String!
        stock: Int!
        price: Float!
    }

    input CustomerInput {
        name: String!
        lastName: String!
        company: String!
        email: String!
        phone: String
    }

    input OrderProductInput {
        id: ID
        quantity: Int
    }

    input OrderInput {
        order: [OrderProductInput]
        total: Float
        customer: ID
        status: StatusOrder
    }

    enum StatusOrder {
        PENDING
        COMPLETED
        CANCELED
    }

    type Query {
        # Users
        getUser: User

        # Products
        getProducts : [Product]
        getProduct(id: ID!): Product

        # Customers
        getCustomers : [Customer]
        getCustomerSeller: [Customer]
        getCustomer(id: ID!): Customer

        # Orders
        getOrders : [Order]
        getOrderBySeller: [Order]
        getOrder(id: ID!): Order
        getOrderByStatus(status: String!): [Order]

        # Advanced Search
        getTopCustomers: [TopCustomer]
        getTopSellers: [TopSeller]
        getProductsBySearch(text: String): [Product]
    }

    type Mutation {
        # Users
        newUser(input: UserInput): User
        authenticateUser(input: AuthenticateInput): Token

        # Products
        newProduct(input: ProductInput): Product
        updateProduct( id: ID!, input:ProductInput ): Product
        deleteProduct(id: ID!): String

        # Customers
        newCustomer(input: CustomerInput): Customer
        updateCustomer(id: ID!, input: CustomerInput): Customer
        deleteCustomer(id: ID!): String

        # Orders
        newOrder(input: OrderInput): Order
        updateOrder(id:ID!, input: OrderInput): Order
        deleteOrder(id: ID!): String
    }
`;

module.exports = typeDefs;
