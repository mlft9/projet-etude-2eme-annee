const { validateLogin, validateRegister, toUserResponse } = require('./auth.dto');

class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  async login(req, res) {
    const error = validateLogin(req.body);
    if (error) return res.status(400).json({ error });

    try {
      const { token, user } = await this.authService.login(req.body.email, req.body.password);
      res.json({ token, user: toUserResponse(user) });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }

  async register(req, res) {
    const result = validateRegister(req.body);
    if (result.error) return res.status(400).json({ error: result.error });

    try {
      const { token, user } = await this.authService.register(result.data);
      res.status(201).json({ token, user: toUserResponse(user) });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
}

module.exports = AuthController;
