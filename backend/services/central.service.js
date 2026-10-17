import 'dotenv/config';
import axios from 'axios';

/**
 * Central API client
 * ---------------------------------------------------------
 * Thin wrapper over the PHP API on cPanel (api.php), which owns all MySQL
 * access. Node never talks to the database directly.
 */
const centralUrl = () => process.env.CENTRAL_API_URL || 'https://nacosid.tmb.it.com/api.php';
const apiKey = () => process.env.ID_SYSTEM_API_KEY || 'NACOS_LASUSTECH_SECURE_API_KEY';

/** Where files stored on the central server (photos, library files) are publicly served from. */
export const centralPublicUrl = () => centralUrl().replace(/\/api\.php.*$/, '').replace(/\/$/, '');

export const centralGet = async (action, params = {}) => {
  const response = await axios.get(centralUrl(), {
    params: { action, ...params },
    headers: { 'X-API-KEY': apiKey() },
    timeout: 15000,
  });
  return response.data;
};

export const centralPost = async (action, body = {}) => {
  const response = await axios.post(centralUrl(), body, {
    params: { action },
    headers: { 'X-API-KEY': apiKey(), 'Content-Type': 'application/json' },
    timeout: 15000,
  });
  return response.data;
};

export const centralForm = async (action, form) => {
  const response = await axios.post(centralUrl(), form, {
    params: { action },
    headers: { ...form.getHeaders(), 'X-API-KEY': apiKey() },
    timeout: 30000,
    maxBodyLength: Infinity,
  });
  return response.data;
};

/** Identity of the signed-in user, as the PHP API expects it on GET requests. */
export const identityParams = (user) =>
  user.account_type === 'fresher'
    ? { account_type: 'fresher', fresher_id: user.id }
    : { account_type: 'student', matric: user.matric };

/** Same identity for JSON / form bodies. */
export const identityBody = (user) =>
  user.account_type === 'fresher'
    ? { account_type: 'fresher', fresher_id: user.id }
    : { account_type: 'student', matric_number: user.matric };

/** Sends the PHP API's error (status + message) to the browser, or a fallback. */
export const sendCentralError = (res, error, fallback) => {
  const status = error.response?.status || 502;
  const message =
    error.response?.data?.message || error.response?.data?.error || (error.response ? fallback : 'Central system unreachable.');
  res.status(status).json({ message });
};
