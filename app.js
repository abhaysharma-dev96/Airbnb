if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const listingsRouter = require("./routes/listing.js");
const reviewsRouter = require("./routes/review.js");
const userRouter = require("./routes/users.js");
const ExpressError = require("./utils/ExpressError.js");

// HOPSCOTCH SE REQUEST KE LIYE
const cors = require("cors");
app.use(cors());  // allow all origins

// VIEW ENGINE SETUP
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// MIDDLEWARE
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));
app.use("/uploads", express.static("uploads"));

const dbUrl = process.env.ATLASDB_URL;

// ✅ MongoStore Setup
const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600,
});

store.on("error", (err) => {
    console.log("ERROR IN MONGO SESSION STORE", err);
});

// ✅ Session Setup
const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true
    }
};
app.use(session(sessionOptions));
app.use(flash());

// ✅ Passport Setup
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ✅ Flash + Current User Middleware
app.use((req, res, next) => {
    res.locals.successMsg = req.flash("success");
    res.locals.errorMsg = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// ✅ MongoDB Connection (Fixed TLS/SSL issue)
async function main() {
    try {
        await mongoose.connect(dbUrl);
                console.log("✅ Connected to MongoDB Atlas");
        // ✅ Routes
app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews", reviewsRouter);
app.use("/", userRouter);

// ✅ Root Route
app.get("/", (req, res) => {
    res.redirect("/listings"); 
});

        // ✅ Server Start
      const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
    } catch (err) {
        console.error("❌ MongoDB connection error:", err.message);
    }
}
main();


// ✅ Error Handler

// app.use((err, req, res, next) => {
//     const { statusCode = 500, message = "Something went wrong!" } = err;
//     res.status(statusCode).render("error.ejs", { message });
// });
// ✅ Error Handler
app.use((err, req, res, next) => {
    console.error(err);   // <-- log full error in terminal
    const { statusCode = 500 } = err;
    if (!err.message) err.message = "Oh No, Something Went Wrong!";
    res.status(statusCode).render("error.ejs", { message: err.message });
});
