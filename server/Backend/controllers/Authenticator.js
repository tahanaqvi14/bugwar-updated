import bcrypt from 'bcrypt';

// Hashes a password. Never log the input: it is the user's plain-text password.
const Authenticator = async (input) => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(input, salt);

  return {
    hash,
  };
};

export default Authenticator;
