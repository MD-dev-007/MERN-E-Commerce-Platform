import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { socket } from '../../../socket';
import { 
  Stack, 
  Typography, 
  TextField, 
  Button, 
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Box,
  Chip,
  Avatar,
  LinearProgress,
  Card,
  CardContent,
  Container,
  Grid,
} from '@mui/material';
import { selectLoggedInUser } from '../../auth/AuthSlice';
import { 
  fetchAuctionByIdAsync, 
  selectSelectedAuction,
  placeBidAsync,
  selectBidStatus,
  resetBidStatus,
  bidPlaced 
} from '../AuctionSlice';
import { toast } from 'react-toastify';
import GavelIcon from '@mui/icons-material/Gavel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

export const AuctionDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const auction = useSelector(selectSelectedAuction);
  const loggedInUser = useSelector(selectLoggedInUser);
  const bidStatus = useSelector(selectBidStatus);
  const [bidAmount, setBidAmount] = useState('');
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [roomUsers, setRoomUsers] = useState([]);
  const [timeLeft, setTimeLeft] = useState('');
  const [countdown, setCountdown] = useState(null);
  const [auctionStatus, setAuctionStatus] = useState('active');

  useEffect(() => {
    if (!loggedInUser) return;

    // Initial setup
    dispatch(fetchAuctionByIdAsync(id));
    
    // Socket event handlers
    const handleBidPlaced = (data) => {
      console.log('📢 New bid received:', data);
      if (data.auction) {
        dispatch(bidPlaced(data.auction));
        toast.info(data.message);
      }
    };

    const handleConnectedUsers = (users) => {
      console.log('👥 Connected users updated:', users);
      setConnectedUsers(users);
    };

    const handleRoomUsers = ({ users, newUser }) => {
      console.log('🎯 Auction room users:', users);
      setRoomUsers(users);
      if (newUser.socketId !== socket.id) {
        toast.info(newUser.message);
      }
    };

    const handleUserLeft = (data) => {
      console.log('👋 User left:', data);
      toast.info(data.message);
    };

    // Setup socket connection
    socket.connect();
    
    // Join rooms
    socket.emit('userJoined', {
      userId: loggedInUser._id,
      userName: loggedInUser.name
    });
    socket.emit('joinAuction', id);

    // Add event listeners
    socket.on('bidPlaced', handleBidPlaced);
    socket.on('connectedUsers', handleConnectedUsers);
    socket.on('auctionRoomUsers', handleRoomUsers);
    socket.on('userLeft', handleUserLeft);

    socket.on('auctionEnding', (data) => {
      setCountdown(data.countdown);
      toast.warning(data.message);
      setAuctionStatus(data.status);
    });

    socket.on('auctionCountdown', (data) => {
      setCountdown(data.countdown);
      toast.warning(data.message);
      setAuctionStatus(data.status);
    });

    socket.on('countdownCancelled', (data) => {
      setCountdown(null); // Clear the countdown
      toast.success(data.message);
      setAuctionStatus(data.status);
      if (data.auction) {
        dispatch(bidPlaced(data.auction));
      }
    });

    socket.on('auctionEnded', (data) => {
      setCountdown(null);
      toast.info(data.message);
      setAuctionStatus(data.status);
      dispatch(bidPlaced(data.auction));
    });

    // Cleanup
    return () => {
      socket.emit('leaveAuction', id);
      socket.off('bidPlaced', handleBidPlaced);
      socket.off('connectedUsers', handleConnectedUsers);
      socket.off('auctionRoomUsers', handleRoomUsers);
      socket.off('userLeft', handleUserLeft);
      socket.off('auctionEnding');
      socket.off('auctionCountdown');
      socket.off('countdownCancelled');
      socket.off('auctionEnded');
      socket.disconnect();
    };
  }, [id, loggedInUser, dispatch]);

  useEffect(() => {
    if (bidStatus === 'succeeded') {
      toast.success('Bid placed successfully!');
      setBidAmount('');
      dispatch(resetBidStatus());
    } else if (bidStatus === 'failed') {
      toast.error('Failed to place bid. Please try again.');
      dispatch(resetBidStatus());
    }
  }, [bidStatus, dispatch]);

  useEffect(() => {
    let intervalId;

    if (auction?.endDateTime) {
      // Initial update
      updateTimeLeft();
      
      // Set up interval to update every second
      intervalId = setInterval(updateTimeLeft, 1000);
    }

    function updateTimeLeft() {
      const end = new Date(auction.endDateTime);
      const now = new Date();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('Auction Ended');
        clearInterval(intervalId);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      }
    }

    // Cleanup interval on unmount or when auction changes
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [auction]);

  const handlePlaceBid = () => {
    dispatch(placeBidAsync({
      auctionId: id,
      bidData: {
        amount: Number(bidAmount),
        bidder: loggedInUser._id
      }
    }));
  };

  if (!auction) return <LinearProgress />;

  const currentHighestBid = auction?.bids?.length > 0 
    ? Math.max(...auction.bids.map(bid => bid.amount))
    : auction?.startingPrice || 0;

  const isLive = new Date(auction.endDateTime) > new Date();

  return (
    <Box sx={{ 
      backgroundColor: '#f5f5f5',
      minHeight: '90vh',
      py: 4 
    }}>
      <Container maxWidth="xl">
        <Grid container spacing={4}>
          {/* Left Column - Image and Details */}
          <Grid item xs={12} md={8}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 4,
                borderRadius: 2,
                backgroundColor: 'white',
                overflow: 'hidden'
              }}
            >
              <Box
                component="img"
                src={auction.imageUrl}
                alt={auction.productName}
                sx={{
                  width: '100%',
                  height: 400,
                  objectFit: 'contain',
                  borderRadius: 2,
                  mb: 4
                }}
              />
              
              <Typography variant="h3" gutterBottom sx={{ fontWeight: 600 }}>
                {auction.productName}
              </Typography>

              <Box sx={{ mb: 4 }}>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: 'text.secondary',
                    lineHeight: 1.8,
                    fontSize: '1.1rem'
                  }}
                >
                  {auction.description}
                </Typography>
              </Box>

              <Divider sx={{ my: 4 }} />

              {/* Bid History */}
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                Bid History
              </Typography>
              <Stack spacing={2}>
                {auction.bids.slice().reverse().map((bid, index) => (
                  <Card 
                    key={index} 
                    variant="outlined" 
                    sx={{
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateX(8px)',
                      }
                    }}
                  >
                    <CardContent>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar 
                          sx={{ 
                            bgcolor: index === 0 ? 'success.main' : 'primary.main',
                            width: 48,
                            height: 48
                          }}
                        >
                          {bid.bidder.name[0]}
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            ${bid.amount}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            by {bid.bidder.name} - {new Date(bid.timestamp).toLocaleString()}
                          </Typography>
                        </Box>
                        {index === 0 && (
                          <Chip 
                            label="Highest Bid" 
                            color="success" 
                            size="small"
                          />
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Paper>
          </Grid>

          {/* Right Column - Bid Information */}
          <Grid item xs={12} md={4}>
            <Stack spacing={3} position="sticky" top={24}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3,
                  borderRadius: 2,
                  backgroundColor: 'white'
                }}
              >
                <Stack spacing={3}>
                  <Box sx={{ 
                    p: 3, 
                    bgcolor: 'primary.dark',
                    borderRadius: 2,
                    color: 'white',
                    textAlign: 'center'
                  }}>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      ${currentHighestBid}
                    </Typography>
                    <Typography variant="subtitle1">
                      Current Highest Bid
                    </Typography>
                  </Box>

                  <Stack 
                    direction="row" 
                    alignItems="center" 
                    spacing={1}
                    sx={{
                      p: 2,
                      bgcolor: isLive ? 'success.light' : 'error.light',
                      borderRadius: 2,
                      color: 'white'
                    }}
                  >
                    <AccessTimeIcon />
                    <Typography variant="h6">
                      {timeLeft}
                    </Typography>
                  </Stack>

                  {auction.status !== 'ended' ? (
                    !loggedInUser?.isAdmin && (
                      <Box sx={{ mt: 2 }}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Your Bid Amount"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          InputProps={{ 
                            inputProps: { min: currentHighestBid + 1 },
                            startAdornment: <LocalOfferIcon sx={{ mr: 1, color: 'primary.main' }} />
                          }}
                          sx={{ mb: 2 }}
                        />
                        <Button
                          fullWidth
                          variant="contained"
                          size="large"
                          onClick={handlePlaceBid}
                          disabled={!bidAmount || Number(bidAmount) <= currentHighestBid || bidStatus === 'loading'}
                          startIcon={<GavelIcon />}
                          sx={{
                            py: 2,
                            background: 'linear-gradient(45deg, #1a237e 30%, #0d47a1 90%)',
                            '&:hover': {
                              background: 'linear-gradient(45deg, #0d47a1 30%, #1a237e 90%)',
                            }
                          }}
                        >
                          {bidStatus === 'loading' ? 'Placing Bid...' : 'Place Bid'}
                        </Button>
                      </Box>
                    )
                  ) : (
                    <Box sx={{ mt: 2 }}>
                      <Paper
                        elevation={3}
                        sx={{
                          p: 3,
                          bgcolor: 'background.paper',
                          borderRadius: 2,
                          textAlign: 'center'
                        }}
                      >
                        <Typography variant="h6" gutterBottom color="text.secondary">
                          Auction Ended
                        </Typography>
                        {auction.winner ? (
                          <>
                            <Typography variant="h5" color="primary" sx={{ mb: 1 }}>
                              Winner: {auction.winner.username}
                            </Typography>
                            <Typography variant="body1">
                              Winning Bid: ${currentHighestBid}
                            </Typography>
                          </>
                        ) : (
                          <Typography variant="body1" color="error">
                            No bids were placed in this auction
                          </Typography>
                        )}
                      </Paper>
                    </Box>
                  )}
                </Stack>
              </Paper>

              {/* Seller Information */}
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3,
                  borderRadius: 2,
                  backgroundColor: 'white'
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Seller Information
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ width: 56, height: 56, bgcolor: 'secondary.main' }}>
                    {auction.seller.name[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {auction.seller.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Verified Seller
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
        {countdown && (
          <Box
            sx={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1000,
              bgcolor: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              p: 4,
              borderRadius: 2,
              textAlign: 'center'
            }}
          >
            <Typography variant="h1" color="error">
              {countdown}
            </Typography>
            <Typography variant="h5">
              Auction ending soon! Place your bid now!
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
}; 