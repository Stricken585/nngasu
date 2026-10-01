import Joi from 'joi';

export const envValidationSchema = Joi.object({
  DATABASE_URL: Joi.string().uri().required(),
  JWT_SECRET: Joi.string().min(8).required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  COOKIE_NAME: Joi.string().default('access_token'),
  PORT: Joi.number().default(3000),
  ADMIN_EMAIL: Joi.string().email({ tlds: false }).required(),
  ADMIN_PASSWORD: Joi.string().required(),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
});
