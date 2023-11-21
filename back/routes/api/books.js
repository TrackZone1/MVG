const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const fs = require("fs");
const multer = require("multer");
const { v4 } = require("uuid");
const sharp = require("sharp");

const { db, secretKey } = require("../../db.js");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./uploads/");
    },
    filename: function (req, file, cb) {
        const ext = file.mimetype.split("/").pop();
        if (!["jpg", "jpeg", "png"].includes(ext)) {
            return cb(new Error("Only images are allowed"));
        }

        cb(null, "tmp-" + v4() + ".webp");
    },
});

const upload = multer({ storage });

const authenticateJWT = (req, res, next) => {
    const token = req.header("Authorization");
    const bearer = token.split(" ");

    if (!token) {
        return res
            .status(401)
            .json({ message: "Authentication tokens required" });
    }

    jwt.verify(bearer[1], secretKey, (err, decoded) => {
        if (err) {
            return res
                .status(401)
                .json({ message: "Invalid authentication tokens" });
        }

        req.user = decoded;
        next();
    });
};

router.get("/", async (req, res) => {
    const books = await db.Books.find().catch((err) => {
        return res.status(400).json({ message: err.message });
    });

    return res.json(books);
});

router.get("/bestrating", async (req, res) => {
    const books = await db.Books.find()
        .sort({ averageRating: -1 })
        .limit(3)
        .catch((err) => {
            return res.status(400).json({ message: err.message });
        });
    return res.json(books);
});

router.get("/:id", async (req, res) => {
    if (!req.params.id) {
        return res.status(400).json({ message: "Missing parameters" });
    }

    const book = await db.Books.findOne({ _id: req.params.id }).catch((err) => {
        return res.status(400).json({ message: err.message });
    });

    if (!book) {
        return res.status(404).json({ message: "Not found" });
    }

    return res.json(book);
});

router.post("/", authenticateJWT, upload.single("image"), async (req, res) => {
    if (!req.body.book || !req.file) {
        return res.status(400).json({ message: "Missing parameters" });
    }

    const resizeFilename = req.file.filename.split("tmp-")[1];

    sharp(`./uploads/${req.file.filename}`)
        .resize(400, 600, { withoutEnlargement: true })
        .toFile(`./uploads/${resizeFilename}`, (err, info) => {
            if (err) {
                return res.status(400).json({ message: err.message });
            }
            fs.unlinkSync(`./uploads/${req.file.filename}`);
        });

    const book = JSON.parse(req.body.book);
    const imageUrl = `http://${req.get("host")}/uploads/${resizeFilename}`;
    const userId = req.user.id;

    try {
        db.Books.create({
            userId,
            title: book.title,
            author: book.author,
            imageUrl,
            year: book.year,
            genre: book.genre,
            ratings: book.ratings,
            averageRating: book.averageRating,
        });

        return res.status(200).json({ message: "Book Created" });
    } catch (err) {
        try {
            fs.unlinkSync(`./uploads/${req.file.filename}`);
        } catch (err) {
            return res.status(400).json({ message: err.message });
        }
        return res.status(400).json({ message: err.message });
    }
});

router.put(
    "/:id",
    authenticateJWT,
    upload.single("image"),
    async (req, res) => {
        if (!req.file) {
            if (
                req.body.title === "" ||
                req.body.author === "" ||
                req.body.year === "" ||
                req.body.genre === ""
            ) {
                return res.status(400).json({ error: "Missing parameters" });
            }
            req.body.book = JSON.stringify(req.body);
        }

        const book = JSON.parse(req.body.book);
        const userId = req.user.id;

        if (book.userId !== userId) {
            return res.status(403).json({ message: "Unauthorized request" });
        }

        if (req.file) {
            const oldBook = await db.Books.findOne({
                _id: req.params.id,
            }).catch((err) => {
                return res.status(400).json({ message: err.message });
            });
            const filename = oldBook.imageUrl.split("/").pop();

            try {
                fs.unlinkSync(`./uploads/${filename}`);
            } catch (err) {
                return res.status(400).json({ message: err.message });
            }

            const imageUrl = `http://${req.get("host")}/uploads/${
                req.file.filename
            }`;

            db.Books.updateOne(
                { _id: req.params.id, userId },
                {
                    $set: {
                        title: book.title,
                        author: book.author,
                        imageUrl,
                        year: book.year,
                        genre: book.genre,
                        ratings: book.ratings,
                        averageRating: book.averageRating,
                    },
                }
            ).catch((err) => {
                try {
                    fs.unlinkSync(`./uploads/${req.file.filename}`);
                    return res.status(400).json({ message: err.message });
                } catch (err) {
                    return res.status(400).json({ message: err.message });
                }
            });
        } else {
            db.Books.updateOne(
                { _id: req.params.id, userId },
                {
                    $set: {
                        title: book.title,
                        author: book.author,
                        year: book.year,
                        genre: book.genre,
                        ratings: book.ratings,
                        averageRating: book.averageRating,
                    },
                }
            ).catch((err) => {
                return res.status(400).json({ message: err.message });
            });
        }

        return res.status(200).json({ message: "Book Updated" });
    }
);

router.delete("/:id", authenticateJWT, async (req, res) => {
    const userId = req.user.id;
    const book = await db.Books.findOne({ _id: req.params.id }).catch((err) => {
        return res.status(400).json({ message: err.message });
    });

    if (book.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized request" });
    }

    const filename = book.imageUrl.split("/").pop();
    try {
        fs.unlinkSync(`./uploads/${filename}`);
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }

    if (!book) {
        return res.status(400).json({ message: "Book not found" });
    }

    if (book.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized request" });
    }

    await db.Books.deleteOne({ _id: req.params.id }).catch((err) => {
        return res.status(400).json({ message: err.message });
    });

    return res.status(200).json({ message: "Book Deleted" });
});

router.post("/:id/rating", authenticateJWT, async (req, res) => {
    if (!req.body.rating) {
        return res.status(400).json({ message: "Missing parameters" });
    }

    const rating = req.body.rating;
    const userId = req.user.id;

    if (rating < 0 || rating > 5) {
        return res.status(400).json({ message: "Invalid rating" });
    }

    const book = await db.Books.findOne({ _id: req.params.id }).catch((err) => {
        return res.status(400).json({ message: err.message });
    });

    if (!book) {
        return res.status(400).json({ message: "Book not found" });
    }

    const userRating = book.ratings.find((r) => r.userId === userId);

    if (userRating) {
        return res.status(400).json({ message: "Rating already exists" });
    }

    book.ratings.push({ userId, grade: rating });
    book.averageRating =
        book.ratings.reduce((acc, r) => acc + r.grade, 0) / book.ratings.length;
    await book.save().catch((err) => {
        return res.status(400).json({ message: err.message });
    });

    return res.status(200).json(book);
});

module.exports = router;
