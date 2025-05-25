const { Server } = require("socket.io");
const Auction = require("./models/Auction");

let io;
let connectedClients = new Map(); // Track connected clients
let auctionTimers = new Map(); // Store timers for each auction

const INACTIVITY_TIMEOUT = 60 * 1000; // 30 seconds for testing
const FINAL_COUNTDOWN = 15; // 10 seconds

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true
    },
    path: '/socket.io/',
    transports: ['polling', 'websocket'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Check all active auctions periodically
  setInterval(checkAllActiveAuctions, 5000); // Check every 5 seconds

  io.on("connection", (socket) => {
    console.log("🟢 New client connected with ID:", socket.id);

    socket.on("userJoined", ({ userId, userName }) => {
      connectedClients.set(socket.id, { userId, userName });
      socket.join(`user_${userId}`); // Join personal room
      console.log("👤 User joined:", { socketId: socket.id, userId, userName });
      
      const connectedUsers = Array.from(connectedClients.values());
      io.emit('connectedUsers', connectedUsers);
    });

    socket.on("joinAuction", async (auctionId) => {
      socket.join(`auction_${auctionId}`);
      const user = connectedClients.get(socket.id);
      
      const usersInRoom = Array.from(connectedClients.entries())
        .filter(([socketId]) => io.sockets.adapter.rooms.get(`auction_${auctionId}`)?.has(socketId))
        .map(([_, user]) => user);

      io.to(`auction_${auctionId}`).emit('auctionRoomUsers', {
        users: usersInRoom,
        newUser: {
          socketId: socket.id,
          userName: user?.userName,
          message: `${user?.userName || 'Unknown'} joined the auction`
        }
      });
    });

    socket.on("leaveAuction", (auctionId) => {
      socket.leave(`auction_${auctionId}`);
      const user = connectedClients.get(socket.id);
      io.to(`auction_${auctionId}`).emit('userLeft', {
        message: `${user?.userName || 'Unknown'} left the auction`
      });
    });

    socket.on("disconnect", () => {
      const user = connectedClients.get(socket.id);
      if (user) {
        connectedClients.delete(socket.id);
        io.emit('connectedUsers', Array.from(connectedClients.values()));
      }
    });
  });

  return io;
};

const checkAllActiveAuctions = async () => {
  try {
    const activeAuctions = await Auction.find({ status: { $in: ['active', 'ending'] } });
    
    for (const auction of activeAuctions) {
      const now = new Date();
      const lastActivity = auction.lastBidTime || auction.startDateTime;
      const timeSinceLastActivity = now - new Date(lastActivity);

      console.log(`Checking auction ${auction._id}:`, {
        status: auction.status,
        lastActivity,
        timeSinceLastActivity,
        threshold: INACTIVITY_TIMEOUT
      });

      // Only check inactivity for active auctions
      if (auction.status === 'active' && timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
        if (!auctionTimers.has(auction._id)) {
          console.log(`Starting ending sequence for inactive auction: ${auction._id}`);
          await startEndingSequence(auction._id);
        }
      }
    }
  } catch (error) {
    console.error('Error checking active auctions:', error);
  }
};

const startEndingSequence = async (auctionId) => {
  try {
    const auction = await Auction.findById(auctionId);
    if (!auction || auction.status !== 'active') return;

    console.log(`Starting ending sequence for auction ${auctionId}`);
    
    auction.status = 'ending';
    await auction.save();

    let countdown = FINAL_COUNTDOWN;
    let countdownActive = true;

    io.to(`auction_${auctionId}`).emit('auctionEnding', {
      message: 'No bids for 30 seconds. Auction ending in 10 seconds!',
      countdown,
      status: 'ending'
    });

    const countdownInterval = setInterval(async () => {
      try {
        if (!countdownActive) {
          io.to(`auction_${auctionId}`).emit('countdownCancelled', {
            message: 'Countdown cancelled due to new bid.',
            countdown: null,
            status: 'active'
          });
          clearInterval(countdownInterval);
          return;
        }

        countdown--;
        console.log(`Countdown for auction ${auctionId}: ${countdown}`);
        
        // Get fresh auction status
        const currentAuction = await Auction.findById(auctionId);
        if (!currentAuction || currentAuction.status === 'active') {
          console.log('Auction status changed, stopping countdown');
          io.to(`auction_${auctionId}`).emit('countdownCancelled', {
            message: 'Countdown cancelled due to new bid.',
            countdown: null,
            status: 'active'
          });
          countdownActive = false;
          clearInterval(countdownInterval);
          auctionTimers.delete(auctionId);
          return;
        }
        
        if (countdown > 0) {
          io.to(`auction_${auctionId}`).emit('auctionCountdown', {
            countdown,
            message: `Auction ending in ${countdown} seconds!`,
            status: 'ending'
          });
        } else {
          clearInterval(countdownInterval);
          await endAuction(auctionId);
        }
      } catch (error) {
        console.error('Error in countdown interval:', error);
        clearInterval(countdownInterval);
      }
    }, 1000);

    auctionTimers.set(auctionId, { 
      intervalId: countdownInterval,
      countdownActive: true,
      resetCountdown: async () => {
        try {
          console.log(`Resetting countdown for auction ${auctionId}`);
          countdownActive = false;
          clearInterval(countdownInterval);
          auctionTimers.delete(auctionId);
          
          const auctionToUpdate = await Auction.findById(auctionId);
          if (auctionToUpdate) {
            auctionToUpdate.status = 'active';
            auctionToUpdate.lastBidTime = new Date();
            await auctionToUpdate.save();
            
            io.to(`auction_${auctionId}`).emit('countdownCancelled', {
              message: 'New bid placed! Countdown cancelled.',
              countdown: null,
              status: 'active',
              auction: auctionToUpdate
            });
            
            await startInactivityTimer(auctionId);
          }
        } catch (error) {
          console.error('Error resetting countdown:', error);
        }
      }
    });
  } catch (error) {
    console.error('Error in startEndingSequence:', error);
  }
};

const startInactivityTimer = async (auctionId) => {
  try {
    // Clear any existing timers
    if (auctionTimers.has(auctionId)) {
      const timer = auctionTimers.get(auctionId);
      if (timer.timeoutId) clearTimeout(timer.timeoutId);
      if (timer.intervalId) clearInterval(timer.intervalId);
      auctionTimers.delete(auctionId);
    }

    const auction = await Auction.findById(auctionId);
    if (!auction || auction.status !== 'active') return;

    const now = new Date();
    const lastActivity = auction.lastBidTime || auction.startDateTime;
    const timeSinceLastActivity = now - new Date(lastActivity);

    if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
      await startEndingSequence(auctionId);
    } else {
      const remainingTime = INACTIVITY_TIMEOUT - timeSinceLastActivity;
      console.log(`Setting inactivity timer for auction ${auctionId}: ${remainingTime}ms`);
      const timeoutId = setTimeout(() => startEndingSequence(auctionId), remainingTime);
      auctionTimers.set(auctionId, { timeoutId });
    }
  } catch (error) {
    console.error('Error in startInactivityTimer:', error);
  }
};

const endAuction = async (auctionId) => {
  try {
    console.log(`Ending auction ${auctionId}`);
    
    const auction = await Auction.findById(auctionId);
    if (!auction || auction.status === 'ended') return;

    if (auction.bids.length > 0) {
      const highestBid = auction.bids.reduce((prev, current) => 
        (prev.amount > current.amount) ? prev : current
      );
      auction.winner = highestBid.bidder;
    }
    
    auction.status = 'ended';
    await auction.save();

    const populatedAuction = await Auction.findById(auctionId)
      .populate("seller", "-password")
      .populate("bids.bidder", "-password")
      .populate("winner", "-password");

    io.to(`auction_${auctionId}`).emit('auctionEnded', {
      auction: populatedAuction,
      message: auction.bids.length > 0 
        ? `Auction has ended! Winner: ${populatedAuction.winner.username}`
        : 'Auction has ended with no bids!',
      status: 'ended',
      countdown: null
    });

    if (auctionTimers.has(auctionId)) {
      const timer = auctionTimers.get(auctionId);
      if (timer.intervalId) clearInterval(timer.intervalId);
      if (timer.timeoutId) clearTimeout(timer.timeoutId);
      auctionTimers.delete(auctionId);
    }
  } catch (error) {
    console.error('Error ending auction:', error);
  }
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

module.exports = { initializeSocket, getIO, startInactivityTimer, auctionTimers }; 