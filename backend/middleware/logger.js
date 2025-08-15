const logger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || '';

  // Log the request
  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip} - User-Agent: ${userAgent}`);

  // Capture the original res.json to log response status
  const originalJson = res.json;
  res.json = function(body) {
    const responseTime = Date.now() - req.startTime;
    console.log(`[${timestamp}] ${method} ${url} - ${res.statusCode} - ${responseTime}ms`);
    
    // Call the original json method
    return originalJson.call(this, body);
  };

  // Set start time for response time calculation
  req.startTime = Date.now();

  next();
};

module.exports = logger;