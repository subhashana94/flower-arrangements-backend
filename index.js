import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

import routes from "./routes/RouteIndex.js"

const app = express();
app.use(cors());
app.use(bodyParser.json());
dotenv.config();

const PORT = process.env.PORT || 7000;
const MONGO_URL = process.env.MONGO_URL;
const BUSINESS_NAME = process.env.BUSINESS_NAME;
const RELEASE_VERSION = process.env.RELEASE_VERSION;

const BASE_PATH = `/${BUSINESS_NAME}/api/${RELEASE_VERSION}`;

mongoose.connect(MONGO_URL).then((connection) => {

    console.log('Successfully Connected to MongoDB');

    routes.forEach(route => {
        app.use(BASE_PATH + route.path, route.router);
        console.log(`✅ Route mounted: ${BASE_PATH}${route.path}`);
    });

    app.listen(PORT, () => {
        console.log("Server started on port : " +  PORT);
    });
}).catch((error) => {
    console.error("Server connection failure - " + error);
});

