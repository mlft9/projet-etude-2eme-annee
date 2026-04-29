const { Router } = require('express');

module.exports = (diagnosticsController, authMiddleware) => {
  const router = Router();
  router.get('/', authMiddleware, (req, res) => diagnosticsController.getAll(req, res));
  router.post('/', authMiddleware, (req, res) => diagnosticsController.create(req, res));
  router.post('/:id/affiner', authMiddleware, (req, res) => diagnosticsController.affiner(req, res));
  return router;
};
