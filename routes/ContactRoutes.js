import { Router } from "express";
import { requireAuth } from "../middlewares/AuthMiddleware.js"
import { getAllContacts, getContactsForDmList, searchContacts } from "../controllers/ContactsController.js";

const contactRoutes = Router();

contactRoutes.post("/search", requireAuth, searchContacts);
contactRoutes.get("/get-contacts-for-dm", requireAuth, getContactsForDmList)
contactRoutes.get("/get-all-contacts", requireAuth, getAllContacts)

export default contactRoutes;