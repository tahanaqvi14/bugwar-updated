// import Joi from 'joi';
import bcrypt from 'bcrypt';

const Authenticator = async (input) => {
  const { displayname, username, password } = input;

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  // Return processed and safe data
  return {
    displayname,
    username,
    hash,
  };
};

export default Authenticator;
