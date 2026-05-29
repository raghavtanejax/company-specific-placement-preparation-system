import jwt from 'jsonwebtoken';

export const auth = (req, res, next) => {
  try {
    let token = req.header('Authorization')?.replace('Bearer ', '');
    
    // Fallback to cookie-based auth
    if (!token && req.headers.cookie) {
      const cookies = Object.fromEntries(
        req.headers.cookie.split('; ').map((c) => {
          const parts = c.split('=');
          return [parts[0], parts.slice(1).join('=')];
        })
      );
      token = cookies.token;
    }
    
    if (!token) {
      return res.status(401).json({ message: 'No auth token, access denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
