import { Router } from 'express';
import axios from 'axios';
import { listBlogs, listEvents, listExecutives } from '../services/admin.service.js';

const router = Router();
const headers = { 'X-API-KEY': process.env.ID_SYSTEM_API_KEY || 'NACOS_LASUSTECH_SECURE_API_KEY' };

const fetchRemote = async (action) => {
  const response = await axios.get(`https://nacosid.tmb.it.com/api.php?action=${action}`, {
    headers,
    timeout: 12000,
  });
  return response.data || [];
};

router.get('/executives', async (_req, res) => {
  try {
    const local = await listExecutives();
    if (local.length > 0) {
      res.json(
        local.map((item) => ({
          id: item.id,
          name: item.name,
          post: item.post,
          level: item.level,
          description: item.description,
          image: item.image_url,
        })),
      );
      return;
    }
  } catch (_error) {
  }

  try {
    res.json(await fetchRemote('executives'));
  } catch (error) {
    console.error('Executives fetch error:', error.message);
    res.json([]);
  }
});

router.get('/events', async (_req, res) => {
  try {
    const local = await listEvents();
    if (local.length > 0) {
      res.json(
        local.map((item) => ({
          id: item.slug || String(item.id),
          title: item.title,
          date: item.start_date
            ? new Date(item.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            : '',
          description: item.description,
          image: item.cover_image_url,
          event_date: item.start_date,
          upcoming: item.event_status === 'upcoming',
          ongoing: item.event_status === 'current',
          contain: true,
          location: item.location,
          gallery: item.gallery || [],
        })),
      );
      return;
    }
  } catch (_error) {
  }

  try {
    res.json(await fetchRemote('events'));
  } catch (error) {
    console.error('Events fetch error:', error.message);
    res.json([]);
  }
});

router.get('/blogs', async (_req, res) => {
  try {
    const local = await listBlogs();
    if (local.length > 0) {
      res.json(
        local.map((item) => ({
          id: item.slug || String(item.id),
          title: item.title,
          excerpt: item.excerpt,
          content: item.content,
          author: item.author,
          date: item.published_at,
          category: item.category,
          image: item.image_url,
        })),
      );
      return;
    }
  } catch (_error) {
  }

  try {
    res.json(await fetchRemote('blogs'));
  } catch (error) {
    console.error('Blogs fetch error:', error.message);
    res.json([]);
  }
});

export default router;
