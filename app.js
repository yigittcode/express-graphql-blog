const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const { createHandler } = require('graphql-http/lib/use/express');
const graphqlSchema = require('./graphQL/schema');
const graphqlResolvers = require('./graphQL/resolvers');
const postRoute = require('./routes/posts');
const auth = require('./middlewares/auth');
const morgan = require('morgan');
const fs = require('fs');
require('dotenv').config();

const app = express();
const MONGODB_URI = process.env.MONGODB_URI;

app.use(express.json());
app.use(require('helmet')());
app.use(require('compression')());

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(auth);

app.get('/deneme', (req, res) => {
    res.json('Accessing is successful.');
});

app.use('/post', postRoute);

app.all('/graphql', createHandler({
    schema: graphqlSchema,
    rootValue: graphqlResolvers,
    context: (req) => ({ req }),
    formatError: (err) => ({
        message: err.message,
        code: err.extensions?.code || err.originalError?.code || 500,
        locations: err.locations,
        path: err.path,
        extensions: err.extensions,
    }),
}));

mongoose.connect(MONGODB_URI)
    .then(() => {
        const port = process.env.PORT || 8080;
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    })
    .catch(err => console.error(err));