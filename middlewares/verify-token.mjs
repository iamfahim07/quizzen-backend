// external import
import jwt from "jsonwebtoken";

// internal import
import { getNewTokens } from "../utilities/get-new-tokens.mjs";

export const verifyToken = (req, res, next) => {
  const { accessToken, refreshToken } = req.cookies || {};

  if (!accessToken && !refreshToken) {
    return res
      .status(401)
      .json({ message: "Unauthorized: No tokens provided" });
  }

  try {
    const accessTokenDecoded = jwt.verify(accessToken, process.env.SECRET_KEY);

    if (accessTokenDecoded.type !== "access") {
      throw new Error("Invalid token type");
    }

    req.user = {
      fullName: accessTokenDecoded.fullName,
      username: accessTokenDecoded.username,
      role: accessTokenDecoded.role,
    };
    return next();
  } catch (accessErr) {
    if (accessToken && accessErr.name !== "TokenExpiredError") {
      return res.status(401).json({ message: "Invalid token" });
    }

    try {
      const refreshTokenDecoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_SECRET_KEY
      );

      if (refreshTokenDecoded.type !== "refresh") {
        throw new Error("Invalid refresh token type");
      }

      const user = {
        fullName: refreshTokenDecoded.fullName,
        username: refreshTokenDecoded.username,
        role: refreshTokenDecoded.role,
      };

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        getNewTokens(user);

      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 1000, // 1 hour
      });

      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      req.user = user;
      return next();
    } catch (refreshErr) {
      // Clear invalid cookies
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      return res.status(401).json({ message: "Invalid or expired tokens" });
    }
  }
};
