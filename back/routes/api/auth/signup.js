const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");

const { db } = require("../../../db.js");

router.post("/api/auth/signup", async (req, res) => {
    if (!req.body.email || !req.body.password) {
        return res.status(400).json({ message: "Missing parameters" });
    }

    const email = req.body.email;
    const password = req.body.password;
    const hashedPassword = await bcrypt.hash(password, 10);

    if (db.collection("users").findOne({ email })) {
        return res.status(400).json({ message: "User already exists" });
    }

    db.collection("users").insertOne({ email, password: hashedPassword });

    return res.status(201).json({ message: "User created" });
});

module.exports = router;
