const { Router } = require('express');

module.exports = (capteursController, authMiddleware) => {
  const router = Router();
  router.get('/', authMiddleware, (req, res) => capteursController.getAll(req, res));
  router.post('/', authMiddleware, (req, res) => capteursController.create(req, res));
  router.delete('/:id', authMiddleware, (req, res) => capteursController.delete(req, res));
  router.patch('/:id/parcelle', authMiddleware, (req, res) => capteursController.associate(req, res));
  return router;
};
