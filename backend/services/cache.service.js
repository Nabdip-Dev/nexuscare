const NodeCache = require('node-cache');

const cache = new NodeCache({
  stdTTL: 300,       // 5 min default TTL
  checkperiod: 60,   // check for expired keys every 60s
  useClones: false
});

const KEYS = {
  DOCTORS_LIST: 'doctors:list',
  CATEGORIES: 'categories:all',
  BANNERS: 'banners:active',
  DOCTOR_PROFILE: (id) => `doctor:${id}`,
  AVAILABLE_SLOTS: (doctorId, date) => `slots:${doctorId}:${date}`,
  ANALYTICS: 'admin:analytics'
};

const get = (key) => cache.get(key);
const set = (key, value, ttl) => ttl ? cache.set(key, value, ttl) : cache.set(key, value);
const del = (key) => cache.del(key);
const flush = () => cache.flushAll();

const invalidatePattern = (pattern) => {
  const keys = cache.keys().filter(k => k.startsWith(pattern));
  keys.forEach(k => cache.del(k));
};

module.exports = { cache, KEYS, get, set, del, flush, invalidatePattern };
