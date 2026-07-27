const jwt = require("jsonwebtoken");

function socketAuth(socket, next) {
  try {
    const token =
      socket.handshake.auth?.token ||
      (socket.handshake.headers?.authorization || "").replace("Bearer ", "");

    if (!token) {
      return next(new Error("Authentication token missing"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded; // { id, username, email, role }
    next();
  } catch (err) {
    next(new Error("Invalid or expired token"));
  }
}

module.exports = socketAuth;