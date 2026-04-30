import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_URL = process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co';

/**
 * Paystack Service
 * ---------------------------------------------------------
 * I've wrapped the Paystack API calls here to keep our 
 * routes clean. Senior dev tip: never leak external API 
 * logic directly into your controllers.
 */
class PaystackService {
  /**
   * Initializes a transaction.
   * We need the email, amount (in Kobo), and a reference.
   */
  async initializeTransaction(data) {
    try {
      const response = await axios.post(
        `${PAYSTACK_URL}/transaction/initialize`,
        {
          ...data,
          amount: data.amount * 100, // Paystack works in Kobo/Cents
        },
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Paystack Initialize Error:', error.response?.data || error.message);
      throw new Error('Failed to initialize Paystack transaction');
    }
  }

  /**
   * Verifies a transaction using the reference.
   * This is what we call after the user pays to confirm they actually did it.
   */
  async verifyTransaction(reference) {
    try {
      const response = await axios.get(
        `${PAYSTACK_URL}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Paystack Verify Error:', error.response?.data || error.message);
      throw new Error('Failed to verify Paystack transaction');
    }
  }
}

export default new PaystackService();
