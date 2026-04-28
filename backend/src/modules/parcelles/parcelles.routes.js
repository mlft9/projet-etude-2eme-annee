const { Router } = require('express');

module.exports = (parcellesController, authMiddleware) => {
  const router = Router();
  router.get('/', authMiddleware, (req, res) => parcellesController.getAll(req, res));
  router.post('/', authMiddleware, (req, res) => parcellesController.create(req, res));
  return router;
};
