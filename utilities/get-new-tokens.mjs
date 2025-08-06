// external import
import jwt from "jsonwebtoken";

export const getNewTokens = (user) => {
  const tokenPayload = {
    fullName: user.fullName,
    username: user.username,
    role: user.role,
  };

  const accessToken = jwt.sign(
    { ...tokenPayload, type: "access" },
    process.env.SECRET_KEY,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );

  const refreshToken = jwt.sign(
    { ...tokenPayload, type: "refresh" },
    process.env.REFRESH_SECRET_KEY,
    {
      expiresIn: process.env.REFRESH_JWT_EXPIRES_IN,
    }
  );

  return { accessToken, refreshToken };
};
