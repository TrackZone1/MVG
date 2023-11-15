const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const { db, secretKey } = require("../../../db.js");

router.post("/", async (req, res) => {
    if (!req.body.email || !req.body.password) {
        return res.status(400).json({ message: "Missing parameters" });
    }

    const email = req.body.email;
    const password = req.body.password;

    const user = await db.Users.findOne({ email: email }).catch((err) => {
        return res.status(400).json({ message: err.message });
    });

    if (!user) {
        return res.status(400).json({ message: "User does not exist" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
        return res.status(400).json({ message: "Wrong password" });
    }

    const token = jwt.sign({ id: user._id }, secretKey, { expiresIn: "24h" });

    res.json({ userId: user._id, token: token });
});

module.exports = router;
