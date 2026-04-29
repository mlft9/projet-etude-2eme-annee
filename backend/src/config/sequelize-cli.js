require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

const ssl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false;

module.exports = {
  development: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectOptions: { ssl },
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectOptions: { ssl },
  },
};
