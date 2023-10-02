const express = require("express");
const router = express.Router();
const crypto = require("crypto");

const { db } = require("../../../db.js");

router.post("/api/auth/signup", async (req, res) => {
    if (!req.body.email || !req.body.password) {
        return res.status(400).json({ message: "Missing parameters" });
    }

    const user = await db.collection("users").findOne({
        email: req.body.email,
    });

    if (user) {
        return res.status(400).json({ message: "User already exists" });
    }

    const salt = crypto.randomBytes(16).toString("hex");

    const hash = crypto.pbkdf2Sync(req.body.password, salt, 1000, 64, "sha512");

    const newUser = {
        email: req.body.email,
        password: hash.toString("hex"),
        salt: salt,
    };

    const collection = db.collection("users");

    await collection.insertOne(newUser);

    res.json({ message: "User created" });
});

module.exports = router;
