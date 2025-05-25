require("dotenv").config()
const express = require('express')
const cors = require('cors')
const morgan = require("morgan")
const cookieParser = require("cookie-parser")
const authRoutes = require("./routes/Auth")
const productRoutes = require("./routes/Product")
const orderRoutes = require("./routes/Order")
const cartRoutes = require("./routes/Cart")
const brandRoutes = require("./routes/Brand")
const categoryRoutes = require("./routes/Category")
const userRoutes = require("./routes/User")
const addressRoutes = require('./routes/Address')
const reviewRoutes = require("./routes/Review")
const wishlistRoutes = require("./routes/Wishlist")
const auctionRoutes = require("./routes/Auction")
const paymentRoutes = require('./routes/Payment')
const { connectToDB } = require("./database/db")
const { createServer } = require('http');
const { initializeSocket } = require('./socket');
const mongoose = require("mongoose")

// server init
const PORT = process.env.PORT || 8000

// Function to check if port is in use
const isPortInUse = (port) => {
  return new Promise((resolve, reject) => {
    const server = require('net').createServer()
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true)
      } else {
        reject(err)
      }
    })
    
    server.once('listening', () => {
      server.close()
      resolve(false)
    })
    
    server.listen(port)
  })
}

// Function to kill process on port
const killProcessOnPort = async (port) => {
  try {
    if (process.platform === 'win32') {
      await require('child_process').exec(`netstat -ano | findstr :${port}`, async (err, stdout) => {
        if (stdout) {
          const pid = stdout.split(' ').filter(Boolean).pop()
          if (pid) {
            await require('child_process').exec(`taskkill /F /PID ${pid}`)
          }
        }
      })
    } else {
      await require('child_process').exec(`lsof -i :${port} -t | xargs kill -9`)
    }
  } catch (error) {
    console.log('No process found on port', port)
  }
}

const startServer = async () => {
  try {
    let retries = 5;
    let connected = false;

    while (retries > 0 && !connected) {
      try {
        await connectToDB();
        connected = true;
      } catch (error) {
        console.log(`Failed to connect to MongoDB. Retries left: ${retries}`);
        retries--;
        if (retries === 0) throw error;
        // Wait for 5 seconds before retrying
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    const app = express();
    const httpServer = createServer(app);

    // Initialize Socket.IO
    initializeSocket(httpServer);

    // middlewares
    app.use(express.json())
    app.use(cors({
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true
    }))
    app.use(cookieParser())
    app.use(morgan("tiny"))

    // routes
    app.use("/auth", authRoutes)
    app.use("/products", productRoutes)
    app.use("/orders", orderRoutes)
    app.use("/cart", cartRoutes)
    app.use("/brands", brandRoutes)
    app.use("/categories", categoryRoutes)
    app.use("/users", userRoutes)
    app.use("/address", addressRoutes)
    app.use("/reviews", reviewRoutes)
    app.use("/wishlist", wishlistRoutes)
    app.use("/auctions", auctionRoutes)
    app.use("/payment", paymentRoutes)

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error(err.stack)
      res.status(500).send('Something broke!')
    })

    // Start server only if DB is connected
    if (mongoose.connection.readyState === 1) {
      httpServer.listen(PORT, () => {
        console.log('🚀 Server is running on port:', PORT);
      });
    } else {
      throw new Error('Database connection not ready');
    }

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server with retries
let retries = 3
const startWithRetry = async () => {
  try {
    await startServer()
  } catch (error) {
    if (retries > 0) {
      retries--
      console.log(`Retrying server start... (${retries} attempts remaining)`)
      setTimeout(startWithRetry, 2000)
    } else {
      console.error('Failed to start server after multiple attempts')
      process.exit(1)
    }
  }
}

startWithRetry()