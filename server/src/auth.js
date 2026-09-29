import jwt from 'jsonwebtoken';

export function signToken(user, secret) {
  return jwt.sign({ sub: String(user.id), email: user.email, name: user.name }, secret, {
    algorithm: 'HS256',
    expiresIn: '2h',
    issuer: 'progree-internship'
  });
}

export function requireAuth(secret) {
  return (req, res, next) => {
    const header = req.get('authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) return res.status(401).json({ error: 'Authentication required.' });
    try {
      const payload = jwt.verify(token, secret, { algorithms: ['HS256'], issuer: 'progree-internship' });
      req.user = { id: Number(payload.sub), email: payload.email, name: payload.name };
      return next();
    } catch {
      return res.status(401).json({ error: 'Your session is invalid or expired.' });
    }
  };
}

