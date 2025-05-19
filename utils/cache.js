import redis from './redis.js';                                            
                                                                           
const DEFAULT_TTL = 3600; // 1 hour                                        
                                                                           
export const cache = {                                                     
  get: async (key) => await redis.get(key),                                
  set: async (key, value, ttl = DEFAULT_TTL) => {                          
    await redis.setex(key, ttl, JSON.stringify(value));                    
  },                                                                       
  del: async (key) => await redis.del(key)                                 
};                                        