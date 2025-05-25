const Auction = require("../models/Auction")
const { getIO } = require('../socket');

exports.create = async (req, res) => {
    try {
        const auctionData = {
            ...req.body,
            status: 'active',
            lastBidTime: new Date(req.body.startDateTime)
        };
        
        const created = new Auction(auctionData);
        await created.save();
        
        const populatedAuction = await Auction.findById(created._id)
            .populate("seller", "-password")
            .populate("bids.bidder", "-password");
        
        // Start inactivity timer for new auction
        const { startInactivityTimer } = require('../socket');
        await startInactivityTimer(created._id);
        
        res.status(201).json(populatedAuction);
    } catch (error) {
        console.error('Create auction error:', error);
        return res.status(500).json({
            message: 'Error creating auction',
            error: error.message
        });
    }
};

exports.getAll = async (req, res) => {
    try {
        const filter = {}
        const sort = {}
        let page = parseInt(req.query.page) || 1
        let limit = parseInt(req.query.limit) || 10

        // Filtering
        if (req.query.seller) {
            filter.seller = req.query.seller
        }

        if (req.query.status) {
            const now = new Date()
            if (req.query.status === 'active') {
                filter.endDateTime = { $gt: now }
            } else if (req.query.status === 'ended') {
                filter.endDateTime = { $lte: now }
            }
        }

        // Sorting
        if (req.query.sort) {
            const sortOrder = req.query.order === 'desc' ? -1 : 1
            sort[req.query.sort] = sortOrder
        } else {
            sort.createdAt = -1 // Default sort
        }

        // Validate pagination params
        if (page < 1) page = 1
        if (limit < 1 || limit > 50) limit = 10

        const skip = (page - 1) * limit

        const [totalDocs, results] = await Promise.all([
            Auction.countDocuments(filter),
            Auction.find(filter)
                .populate("seller", "-password")
                .populate("bids.bidder", "-password")
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .exec()
        ])

        const totalPages = Math.ceil(totalDocs / limit)

        res.set({
            "X-Total-Count": totalDocs,
            "X-Total-Pages": totalPages,
            "X-Current-Page": page
        })

        res.status(200).json(results)
    } catch (error) {
        console.error('Get auctions error:', error)
        res.status(500).json({
            message: 'Error fetching auctions',
            error: error.message
        })
    }
}

exports.getById = async (req, res) => {
    try {
        const { id } = req.params
        const result = await Auction.findById(id)
            .populate("seller", "-password")
            .populate("bids.bidder", "-password")
        
        if (!result) {
            return res.status(404).json({message: 'Auction not found'})
        }
        
        res.status(200).json(result)
    } catch (error) {
        console.error('Get auction by ID error:', error)
        res.status(500).json({
            message: 'Error getting auction details',
            error: error.message
        })
    }
}

exports.placeBid = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, bidder } = req.body;

        const auction = await Auction.findById(id);
        
        if (!auction) {
            return res.status(404).json({ message: 'Auction not found' });
        }

        if (auction.status === 'ended') {
            return res.status(400).json({ message: 'Auction has ended' });
        }

        const bidAmount = Number(amount);
        const currentHighestBid = auction.bids.length > 0 
            ? Math.max(...auction.bids.map(bid => bid.amount))
            : auction.startingPrice;

        if (isNaN(bidAmount) || bidAmount <= currentHighestBid) {
            return res.status(400).json({ 
                message: 'Bid must be higher than current highest bid',
                currentHighestBid
            });
        }

        // Place the bid first
        const now = new Date();
        auction.bids.push({ bidder, amount: bidAmount, timestamp: now });
        auction.lastBidTime = now;

        // Handle countdown reset if auction is ending
        if (auction.status === 'ending') {
            auction.status = 'active'; // Update status immediately
            const { auctionTimers } = require('../socket');
            const timer = auctionTimers.get(id);
            if (timer && timer.resetCountdown) {
                await timer.resetCountdown();
            }
        }

        await auction.save();

        const populatedAuction = await Auction.findById(id)
            .populate("seller", "-password")
            .populate("bids.bidder", "-password")
            .populate("winner", "-password");

        const io = getIO();
        io.to(`auction_${id}`).emit('bidPlaced', {
            auction: populatedAuction,
            message: `New bid placed: $${bidAmount}`
        });

        res.status(200).json(populatedAuction);
    } catch (error) {
        console.error('Place bid error:', error);
        res.status(500).json({
            message: 'Error placing bid. Please try again.',
            error: error.message
        });
    }
}; 