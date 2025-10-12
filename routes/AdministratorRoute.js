import express from 'express';
import {createAdministrator} from "../controller/AdminController.js";

const router = express.Router();

router.post("/new", createAdministrator);

export default {
    path: '/admin',
    router: router
};
