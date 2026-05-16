import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const KORAPAY_SECRET = process.env.KORAPAY_SECRET_KEY;
const KORAPAY_URL = process.env.KORAPAY_BASE_URL || 'https://api.korapay.com/merchant/api/v1';

/**
 * Korapay Service
 * ---------------------------------------------------------
 * Handling the integration with Korapay for student dues 
 * and other payments. 
 */
class KorapayService {
  /**
   * Initializes a transaction.
   * Korapay expects amount, currency, reference, and customer details.
   */
  async initializeTransaction(data) {
    try {
      const response = await axios.post(
        `${KORAPAY_URL}/charges/initialize`,
        {
          amount: data.amount,
          currency: 'NGN',
          reference: data.reference || `NACOS-${Date.now()}`,
          customer: {
            email: data.email,
            name: data.full_name || 'NACOS Student'
          },
          notification_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/webhook`,
          redirect_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`,
          metadata: data.metadata || {}
        },
        {
          headers: {
            Authorization: `Bearer ${KORAPAY_SECRET}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Korapay Initialize Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to initialize Korapay transaction');
    }
  }

  /**
   * Verifies a transaction using the reference.
   */
  async verifyTransaction(reference) {
    try {
      const response = await axios.get(
        `${KORAPAY_URL}/charges/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${KORAPAY_SECRET}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Korapay Verify Error:', error.response?.data || error.message);
      throw new Error('Failed to verify Korapay transaction');
    }
  }
}

export default new KorapayService();
