const express = require('express')
const auctionController = require("../controllers/Auction")
const router = express.Router()

router
    .post("/", auctionController.create)
    .get("/", auctionController.getAll)
    .get("/:id", auctionController.getById)
    .post("/:id/bid", auctionController.placeBid)

module.exports = router 