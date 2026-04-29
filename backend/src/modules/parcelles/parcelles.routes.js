const { Router } = require('express');

module.exports = (parcellesController, authMiddleware) => {
  const router = Router();
  router.get('/', authMiddleware, (req, res) => parcellesController.getAll(req, res));
  router.post('/', authMiddleware, (req, res) => parcellesController.create(req, res));
  router.put('/:id', authMiddleware, (req, res) => parcellesController.update(req, res));
  router.delete('/:id', authMiddleware, (req, res) => parcellesController.delete(req, res));
  router.get('/:id/capteurs/latest', authMiddleware, (req, res) => parcellesController.getLatestCapteurs(req, res));
  router.get('/:id/capteurs', authMiddleware, (req, res) => parcellesController.getCapteurs(req, res));
  return router;
};
