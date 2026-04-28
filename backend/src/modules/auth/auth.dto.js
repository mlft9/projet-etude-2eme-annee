/**
 * Valide les données de connexion.
 * @param {{ email, password }} body
 * @returns {string|null} message d'erreur ou null si valide
 */
function validateLogin({ email, password } = {}) {
  if (!email || !password) return 'Email et mot de passe requis';
  return null;
}

/**
 * Valide et normalise les données d'inscription.
 * @param {{ name, email, password }} body
 * @returns {{ error: string }|{ data: { name, email, password } }}
 */
function validateRegister({ name, email, password } = {}) {
  if (!name || !email || !password) return { error: 'Champs obligatoires manquants' };
  if (password.length < 6) return { error: 'Mot de passe trop court (6 caractères min)' };
  return { data: { name: name.trim(), email: email.trim().toLowerCase(), password } };
}

/**
 * Formate la réponse publique d'un utilisateur (sans password_hash).
 * @param {import('./auth.entity').UserEntity} user
 */
function toUserResponse(user) {
  return { id: user.id, name: user.name, email: user.email };
}

module.exports = { validateLogin, validateRegister, toUserResponse };
