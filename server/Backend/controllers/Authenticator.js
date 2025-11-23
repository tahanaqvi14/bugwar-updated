// import Joi from 'joi';
import bcrypt from 'bcrypt';

const Authenticator = async (input) => {
  const { password } = input;

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  // Return processed and safe data
  return {
    hash,
  };
};

export default Authenticator;
