const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");

const { secretKey } = require("./db.json");

const app = express();
const port = 4000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const allowedOrigins = ["http://localhost:3000"];
app.use(
    cors({
        origin: function (origin, callback) {
            // Vérifier si l'origine fait partie des origines autorisées
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Access denied by CORS"));
            }
        },
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        credentials: true, // Si vous avez besoin d'envoyer des cookies et des en-têtes d'authentification
    })
);

/* 

UNPROTECTED ROUTES

*/

const signupRoute = require("./routes/api/auth/signup");
app.post("/api/auth/signup", signupRoute);
/*
const loginRoute = require("./routes/api/auth/login");
app.post("/api/auth/login", loginRoute);
*/
/* 

PROTECTED ROUTES

*/

const authenticateJWT = (req, res, next) => {
    const token = req.header("Authorization");

    if (!token) {
        return res
            .status(401)
            .json({ message: "Authentication tokens required" });
    }

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res
                .status(401)
                .json({ message: "Invalid authentication tokens" });
        }

        req.user = decoded;
        next();
    });
};
/*
const booksRoute = require("./routes/api/books");
app.all("/api/books", booksRoute);
*/
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
