const { Router } = require('express');

module.exports = (authController) => {
  const router = Router();
  router.post('/login', (req, res) => authController.login(req, res));
  router.post('/register', (req, res) => authController.register(req, res));
  return router;
};
