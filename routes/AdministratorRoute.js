import express from 'express';
import {loginAdministrator, registerAdministrator} from "../controller/AdminController.js";

const router = express.Router();

router.post("/new", registerAdministrator);
router.post("/login", loginAdministrator);

export default {
    path: '/admin',
    router: router
};
