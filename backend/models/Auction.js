const mongoose = require("mongoose")
const {Schema} = mongoose

const auctionSchema = new Schema({
    productName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    startingPrice: {
        type: Number,
        required: true
    },
    startDateTime: {
        type: Date,
        required: true
    },
    endDateTime: {
        type: Date,
        required: true
    },
    seller: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    bids: [{
        bidder: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        amount: Number,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    lastBidTime: {
        type: Date,
        default: null
    },
    winner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    status: {
        type: String,
        enum: ['active', 'ending', 'ended'],
        default: 'active'
    }
}, {timestamps: true, versionKey: false})

module.exports = mongoose.model('Auction', auctionSchema) 