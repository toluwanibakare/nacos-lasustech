import { Router } from 'express';
import FormData from 'form-data';
import protect from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';
import { centralForm, centralGet, identityBody, identityParams, sendCentralError } from '../services/central.service.js';

const router = Router();

/**
 * ID Card Service Route
 * ---------------------------------------------------------
 * The application (details + photo + how the photo is arranged) is saved by
 * the central PHP API. Identity always comes from the signed-in token, never
 * from the request body.
 */
router.post('/id-card/application', protect, upload.single('image'), async (req, res) => {
  const { photo_zoom, photo_cx, photo_cy, birthday } = req.body;

  try {
    const form = new FormData();
    Object.entries({ ...identityBody(req.user), photo_zoom, photo_cx, photo_cy, birthday }).forEach(
      ([key, value]) => {
        if (value !== undefined && value !== null) form.append(key, String(value));
      },
    );
    if (req.file) {
      form.append('image', req.file.buffer, { filename: req.file.originalname, contentType: req.file.mimetype });
    }

    res.json(await centralForm('id_application', form));
  } catch (error) {
    console.error('❌ ID Card Application Error:', error.response?.data || error.message);
    sendCentralError(res, error, 'Error submitting your ID card application.');
  }
});

/**
 * Status of the signed-in user's application, fee and saved photo arrangement.
 */
router.get('/id-card/status', protect, async (req, res) => {
  try {
    res.json(await centralGet('id_card_status', identityParams(req.user)));
  } catch (error) {
    console.error('⚠️ ID Status Fetch Failed:', error.message);
    sendCentralError(res, error, 'Could not fetch ID status.');
  }
});

export default router;
