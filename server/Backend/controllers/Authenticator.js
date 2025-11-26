// import Joi from 'joi';
import bcrypt from 'bcrypt';

const Authenticator = async (input) => {
  console.log(input)
  // const { password } = input;
  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(input, salt);

  // Return processed and safe data
  return {
    hash,
  };
};

export default Authenticator;
