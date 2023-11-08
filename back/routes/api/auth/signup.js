const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");

const { db } = require("../../../db.js");

router.post("/", async (req, res) => {
    if (!req.body.email || !req.body.password) {
        return res.status(400).json({ message: "Missing parameters" });
    }

    const email = req.body.email;
    const password = req.body.password;
    const hashedPassword = await bcrypt.hash(password, 10);

    const emailExist = await db.Users.findOne({ email });
    if (emailExist) {
        return res.status(400).json({ message: "Email already exists" });
    }

    db.Users.create({ email, password: hashedPassword });

    return res.status(201).json({ message: "User created" });
});

module.exports = router;
