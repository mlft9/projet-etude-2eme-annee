const { Router } = require('express');

module.exports = (diagnosticsController, authMiddleware) => {
  const router = Router();
  router.get('/', authMiddleware, (req, res) => diagnosticsController.getAll(req, res));
  router.post('/', authMiddleware, (req, res) => diagnosticsController.create(req, res));
  return router;
};
