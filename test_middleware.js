const { createMiddleware } = require("@tanstack/react-start");
try {
  const middleware = createMiddleware({ type: "function" });
  middleware();
} catch (e) {
  console.error(e.message);
}
