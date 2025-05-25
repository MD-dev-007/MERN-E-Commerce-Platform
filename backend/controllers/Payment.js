const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: 'your key id',
  key_secret: 'your key secret'
});

exports.createOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    console.log('Creating order for amount:', amount);

    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency: 'INR',
      receipt: 'receipt_' + Date.now(),
    };

    const order = await razorpay.orders.create(options);
    console.log('Order created:', order);
    res.json(order);
  } catch (error) {
    console.error('Payment order creation error:', error);
    res.status(500).json({ message: 'Error creating payment order' });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    console.log('Verifying payment:', { razorpay_order_id, razorpay_payment_id });
    
    const generated_signature = crypto
      .createHmac('sha256', 'y')
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex');

    if (generated_signature === razorpay_signature) {
      console.log('Payment verified successfully');
      res.json({ success: true });
    } else {
      console.log('Payment verification failed');
      res.status(400).json({ success: false });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ success: false });
  }
}; 