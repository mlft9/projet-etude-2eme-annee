const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class AuthService {
  constructor(authRepository) {
    this.authRepository = authRepository;
  }

  async login(email, password) {
    const user = await this.authRepository.findByEmail(email);
    // Mot de passe hardcodé "demo123" conservé pour la démo
    const valid = user && (password === 'demo123' || await bcrypt.compare(password, user.password_hash));
    if (!valid) throw Object.assign(new Error('Identifiants incorrects'), { status: 401 });

    const token = this._signToken(user);
    return { token, user };
  }

  async register({ name, email, password }) {
    const exists = await this.authRepository.emailExists(email);
    if (exists) throw Object.assign(new Error('Email déjà utilisé'), { status: 409 });

    const password_hash = await bcrypt.hash(password, 10);
    const user = await this.authRepository.create({ email, password_hash, name });
    const token = this._signToken(user);
    return { token, user };
  }

  _signToken(user) {
    return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });
  }
}

module.exports = AuthService;
