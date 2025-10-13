import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from "./routes/RouteIndex.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));

dotenv.config();

const PORT = process.env.PORT || 8000;
const MONGO_URL = process.env.MONGO_URL;
const BUSINESS_NAME = process.env.BUSINESS_NAME;
const RELEASE_VERSION = process.env.RELEASE_VERSION;

const BASE_PATH = `/${BUSINESS_NAME}/api/${RELEASE_VERSION}`;

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect(MONGO_URL).then((connection) => {
    console.log('Successfully Connected to MongoDB');

    routes.forEach(route => {
        app.use(BASE_PATH + route.path, route.router);
    });

    app.listen(PORT, () => {
        console.log("Server started on port : " + PORT);
    });
}).catch((error) => {
    console.error("Server connection failure - " + error);
});
