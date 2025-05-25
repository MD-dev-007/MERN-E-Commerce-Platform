import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Typography, 
  Button, 
  Stack,
  Chip,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Box,
  Container,
  Paper
} from '@mui/material';
import ArrowForward from '@mui/icons-material/ArrowForward';
import GavelIcon from '@mui/icons-material/Gavel';
import { fetchAuctionsAsync, selectAuctions } from '../AuctionSlice';
import { selectLoggedInUser } from '../../auth/AuthSlice';

export const AuctionList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const auctions = useSelector(selectAuctions);
  const status = useSelector(state => state.AuctionSlice.status);
  const loggedInUser = useSelector(selectLoggedInUser);
  const theme = useTheme();
  const is600 = useMediaQuery(theme.breakpoints.down(600));

  useEffect(() => {
    dispatch(fetchAuctionsAsync({
      pagination: { page: 1, limit: 10 },
      status: 'active'
    }));
  }, [dispatch]);

  const getCurrentHighestBid = (auction) => {
    if (!auction.bids || auction.bids.length === 0) return auction.startingPrice;
    return Math.max(...auction.bids.map(bid => bid.amount));
  };

  const isAuctionLive = (endDateTime) => {
    return new Date(endDateTime) > new Date();
  };

  if (status === 'loading' || status === 'idle') {
    return (
      <Stack alignItems="center" justifyContent="center" height="50vh">
        <CircularProgress />
      </Stack>
    );
  }

  if (status === 'failed') {
    return (
      <Stack alignItems="center" justifyContent="center" height="50vh">
        <Typography color="error" variant="h6">
          Failed to load auctions. Please try again later.
        </Typography>
      </Stack>
    );
  }

  if (!auctions || auctions.length === 0) {
    return (
      <Stack spacing={3} p={3}>
        <Typography variant="h4" gutterBottom>
          Live Auctions
        </Typography>
        <Typography variant="h6" textAlign="center">
          No auctions available at the moment
        </Typography>
      </Stack>
    );
  }

  return (
    <Box sx={{ 
      background: 'linear-gradient(135deg, #f6f9fc 0%, #eef2f7 100%)',
      minHeight: '100vh'
    }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack spacing={6}>
          {/* Enhanced Hero Section */}
          <Box
            sx={{
              position: 'relative',
              borderRadius: 4,
              overflow: 'hidden',
              mb: 6
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: { xs: 4, md: 8 },
                background: 'linear-gradient(45deg, #1a237e 0%, #0d47a1 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  bottom: 0,
                  left: 0,
                  background: 'url(/auction-bg.jpg) center/cover', // Add a background image
                  opacity: 0.1,
                }
              }}
            >
              <Stack spacing={3} maxWidth="800px" position="relative">
                <Typography 
                  variant="h1" 
                  sx={{
                    fontSize: { xs: '2.5rem', md: '4rem' },
                    fontWeight: 700,
                    textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                  }}
                >
                  Live Auctions
                </Typography>
                <Typography 
                  variant="h5"
                  sx={{
                    fontWeight: 300,
                    maxWidth: '600px',
                    lineHeight: 1.5
                  }}
                >
                  Discover unique items and place your bids in real-time. 
                  Every auction is an opportunity to win something extraordinary.
                </Typography>
              </Stack>
            </Paper>
          </Box>

          {/* Stats Section */}
          <Grid container spacing={3} sx={{ mb: 6 }}>
            {[
              { title: 'Active Auctions', value: auctions.filter(a => isAuctionLive(a.endDateTime)).length },
              { title: 'Total Items', value: auctions.length },
              { title: 'Bidders Online', value: '20+' }, // You can make this dynamic
            ].map((stat, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Paper
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    background: 'white',
                    borderRadius: 2,
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                    }
                  }}
                >
                  <Typography variant="h3" color="primary" fontWeight="bold">
                    {stat.value}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    {stat.title}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Auctions Grid with Enhanced Cards */}
          <Grid container spacing={3}>
            {auctions.map((auction) => (
              <Grid item xs={12} sm={6} md={4} key={auction._id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
                    },
                    position: 'relative',
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  {isAuctionLive(auction.endDateTime) && (
                    <Chip
                      label="LIVE NOW"
                      color="error"
                      sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        zIndex: 1,
                        animation: 'pulse 1.5s infinite',
                        '@keyframes pulse': {
                          '0%': { transform: 'scale(1)' },
                          '50%': { transform: 'scale(1.05)' },
                          '100%': { transform: 'scale(1)' },
                        },
                      }}
                    />
                  )}
                  
                  <CardMedia
                    component="img"
                    height="280"
                    image={auction.imageUrl}
                    alt={auction.productName}
                    sx={{ 
                      objectFit: 'cover',
                      transition: 'transform 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.05)',
                      }
                    }}
                  />
                  
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Typography 
                      variant="h5" 
                      gutterBottom
                      sx={{ 
                        fontWeight: 600,
                        color: '#2c3e50'
                      }}
                    >
                      {auction.productName}
                    </Typography>
                    
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ mb: 3 }}
                    >
                      {auction.description.substring(0, 100)}...
                    </Typography>

                    <Box sx={{ 
                      p: 2, 
                      bgcolor: 'primary.dark',
                      borderRadius: 2,
                      color: 'white',
                      mb: 2,
                      textAlign: 'center'
                    }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Current Bid: ${getCurrentHighestBid(auction)}
                      </Typography>
                    </Box>

                    <Stack 
                      direction="row" 
                      justifyContent="space-between"
                      alignItems="center"
                      spacing={2}
                    >
                      <Chip
                        label={isAuctionLive(auction.endDateTime) 
                          ? `Ends: ${new Date(auction.endDateTime).toLocaleString()}`
                          : auction.status === 'ended' && auction.winner 
                            ? `Winner: ${auction.winner.username}`
                            : 'Auction Ended - No Winner'}
                        color={isAuctionLive(auction.endDateTime) 
                          ? 'success' 
                          : auction.status === 'ended' && auction.winner ? 'primary' : 'error'}
                        variant="outlined"
                        sx={{ 
                          flexGrow: 1,
                          bgcolor: !isAuctionLive(auction.endDateTime) ? 'rgba(0,0,0,0.05)' : 'transparent'
                        }}
                      />
                      <Button 
                        variant="contained"
                        onClick={() => navigate(`/auctions/${auction._id}`)}
                        endIcon={<ArrowForward />}
                        sx={{
                          background: 'linear-gradient(45deg, #1a237e 30%, #0d47a1 90%)',
                          color: 'white',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #0d47a1 30%, #1a237e 90%)',
                          }
                        }}
                      >
                        View Details
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
}; 