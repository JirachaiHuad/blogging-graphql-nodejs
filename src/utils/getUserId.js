import jwt from 'jsonwebtoken';

const JWT_SECRET = 'supersecret';

const  getUserId = (request, requireAuth = true) => {
  const header = request.request ? (
    request.request.headers.authorization
  ) : (
    request.connection.context.Authorization
  );

  if (header) {
    const token = header.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);

    return decoded.userId;
  }

  if (requireAuth) {
    throw new Error('Authentication required');
  }

  return null;
};

export default getUserId;