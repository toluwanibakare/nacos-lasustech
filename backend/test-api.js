import axios from 'axios';

const ID_SYSTEM_API = 'https://nacosid.tmb.it.com/api.php';
const API_KEY = 'NACOS_LASUSTECH_SECURE_API_KEY';

const test = async () => {
  const actions = [
    'get_total_students',
    'get_student_count',
    'student_count',
    'total_students',
    'count_students',
    'student_list',
    'get_all_users',
    'get_users'
  ];
  
  for (const action of actions) {
    try {
      console.log(`\nTesting action: ${action}...`);
      const res = await axios.get(`${ID_SYSTEM_API}?action=${action}`, {
        headers: { 'X-API-KEY': API_KEY },
        timeout: 8000
      });
      console.log(`Status: ${res.status}`);
      console.log(`Data:`, JSON.stringify(res.data));
    } catch (err) {
      console.error(`Error for ${action}:`, err.message);
    }
  }
};

test();
