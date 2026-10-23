import Joi from 'joi';

// Joi in JavaScript is a library used to validate data — like checking if a user's input is correct before saving it.
// These are the same rules the signup page shows, but checked on the server, because anyone can call the API directly.

export const displayNameRule = Joi.string().trim().min(3).max(10).required().label('Display name');
export const usernameRule = Joi.string().trim().min(4).max(12).required().label('Username');
export const emailRule = Joi.string().trim().lowercase()
  .pattern(/^[a-zA-Z0-9._%+-]+@gmail\.com$/)
  .required()
  .label('Email')
  .messages({ 'string.pattern.base': 'Email must be a valid Gmail address' });
export const passwordRule = Joi.string().min(8).max(20).required().label('Password');
export const otpRule = Joi.string().trim().pattern(/^\d{6}$/).required().label('OTP')
  .messages({ 'string.pattern.base': 'OTP must be 6 digits' });

export const signupSchema = Joi.object({
  displayname: displayNameRule,
  username: usernameRule,
  email: emailRule,
  password: passwordRule,
  otp: otpRule,
});

export const INPUT_TYPES = ['numbers', 'array', 'array_and_k'];

const testcaseRule = Joi.object({
  case: Joi.array().items(Joi.number().integer().required()).min(1).required().label('Test case input'),
  expected: Joi.number().integer().required().label('Expected output'),
});

export const challengeSchema = Joi.object({
  _id: Joi.string().optional(),
  // The function name is put into the code runner, so it must be a plain JavaScript identifier.
  function_name: Joi.string().trim().pattern(/^[A-Za-z_$][A-Za-z0-9_$]*$/).max(60).required().label('Function name')
    .messages({ 'string.pattern.base': 'Function name must be a valid JavaScript function name' }),
  problem_statement: Joi.string().trim().min(1).max(5000).required().label('Problem statement'),
  difficulty: Joi.string().valid('Easy', 'Medium', 'Hard').required().label('Difficulty'),
  input_type: Joi.string().valid(...INPUT_TYPES).default('numbers').label('Input type'),
  testcases: Joi.array().items(testcaseRule).min(1).max(10).required().label('Test cases'),
});

// Returns { value } on success or { error: "readable message" }.
export function validate(schema, input) {
  const { error, value } = schema.validate(input, { errors: { wrap: { label: false } } });
  if (error) return { error: error.details[0].message };
  return { value };
}
