const express = require("express");
const { MongoClient } = require("mongodb");

const { mongoUrl } = require("./config");

const app = express();
const port = 3001;

const client = new MongoClient(mongoUrl);

/* 

UNPROTECTED ROUTES

*/

const signupRoute = require("./routes/api/auth/signup");
app.post("/api/auth/signup", signupRoute);

const loginRoute = require("./routes/api/auth/login");
app.post("/api/auth/login", loginRoute);

/* 

PROTECTED ROUTES

*/

const booksRoute = require("./routes/api/books");
app.all("/api/books", booksRoute);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
