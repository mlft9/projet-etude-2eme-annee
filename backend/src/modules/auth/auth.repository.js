class AuthRepository {
  constructor(UserModel) {
    this.User = UserModel;
  }

  findByEmail(email) {
    return this.User.findOne({ where: { email } });
  }

  findById(id) {
    return this.User.findByPk(id);
  }

  async emailExists(email) {
    const count = await this.User.count({ where: { email } });
    return count > 0;
  }

  create({ email, password_hash, name }) {
    return this.User.create({ email, password_hash, name });
  }
}

module.exports = AuthRepository;
