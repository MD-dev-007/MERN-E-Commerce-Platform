import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Button, 
  FormControl, 
  RadioGroup, 
  FormControlLabel, 
  Radio, 
  Stack, 
  Typography,
  Box 
} from '@mui/material';
import { toast } from 'react-toastify';

export const Checkout = ({ amount, auctionId }) => {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const handlePaymentMethodChange = (event) => {
    setPaymentMethod(event.target.value);
  };

  const handlePayment = async () => {
    try {
      if (paymentMethod === 'card') {
        // Create order
        const { data } = await axios.post('/api/payment/create-order', { amount });
        
        const options = {
          key: 'rzp_test_lsmXUVlm0bj4kC',
          amount: data.amount,
          currency: data.currency,
          name: 'Auction House',
          description: 'Payment for auction item',
          order_id: data.id,
          handler: async (response) => {
            try {
              // Verify payment
              const { data } = await axios.post('/api/payment/verify', response);
              if (data.success) {
                toast.success('Payment successful!');
                navigate('/order-success');
              }
            } catch (error) {
              toast.error('Payment verification failed');
            }
          },
          prefill: {
            name: 'User Name',
            email: 'user@example.com',
          },
          theme: {
            color: '#1a237e',
          },
        };

        // Initialize Razorpay
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Handle cash payment
        toast.success('Cash payment selected');
        navigate('/order-success');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment');
    }
  };

  return (
    <Box sx={{ mt: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
      <FormControl component="fieldset" fullWidth>
        <Typography variant="h6" gutterBottom>
          Select Payment Method
        </Typography>
        <RadioGroup
          value={paymentMethod}
          onChange={handlePaymentMethodChange}
          sx={{ mb: 2 }}
        >
          <FormControlLabel value="cash" control={<Radio />} label="Cash" />
          <FormControlLabel value="card" control={<Radio />} label="Card" />
        </RadioGroup>
      </FormControl>

      <Button
        fullWidth
        variant="contained"
        onClick={handlePayment}
        sx={{
          py: 2,
          background: 'linear-gradient(45deg, #1a237e 30%, #0d47a1 90%)',
          '&:hover': {
            background: 'linear-gradient(45deg, #0d47a1 30%, #1a237e 90%)',
          }
        }}
      >
        Pay and Order
      </Button>
    </Box>
  );
}; 