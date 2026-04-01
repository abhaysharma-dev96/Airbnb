const express = require("express");
const router = express.Router(); 
const Listing = require("../models/listing.js");
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, isOwner,validateListing } = require("../middleware.js");
const {listingSchema,reviewSchema} = require("../schema.js");
const listingController = require("../controller/listings.js");
const multer = require("multer");
const {storage} = require("../cloudConfig.js");
// const upload =  multer( {storage} );
const upload = multer({ dest: 'uploads/' });

module.exports.isLoggedIn = (req, res, next) => {
  console.log("isLoggedIn middleware hit");
  if (!req.isAuthenticated()) {
    req.flash("error", "You must be signed in");
    return res.redirect("/login");
  }
  next();
};


// INDEX ROUTE
router.route("/")
.get(wrapAsync(listingController.index) )
// FOR CREATE
.post(isLoggedIn, upload.single("image"), validateListing, wrapAsync(listingController.createListing))


// .post(isLoggedIn,upload.single("listing[image]"),validateListing,wrapAsync(listingController.createListing) );

// NEW ROUTE
router.get("/new",isLoggedIn,listingController.new)

// SHOW ROUTE 
router.route("/:id")
.get(wrapAsync(listingController.showListings) )
// for update
.put(isLoggedIn,isOwner,upload.single("listing[image]"),validateListing,wrapAsync(listingController.updateListing) )

// FOR DELETE

.delete(isLoggedIn,isOwner,wrapAsync(listingController.destroyListing) );
// EDIT ROUTE

router.get("/:id/edit",isLoggedIn,isOwner,wrapAsync(listingController.editListing) );
 

module.exports = router;