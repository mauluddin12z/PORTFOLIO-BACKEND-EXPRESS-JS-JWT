import { Users } from "../model/UserModel.js";
import jwt from "jsonwebtoken";
export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken
    if (!refreshToken)
      return res.status(401).json({ msg: "Not Authorized!, there is no token" });
    const user = await Users.findAll({
      where: {
        refresh_token: refreshToken
      }
    })
    if (!user[0]) return res.status(403).json({ msg: "Forbidden!, There is no user with the token" });
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
      if (err) return res.status(403).json({ msg: "Forbidden!, Your token has expired" });
      const userId = user[0].id;
      const name = user[0].name;
      const email = user[0].email;
      const accessToken = jwt.sign({ userId, name, email }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '15s'
      })
      res.json({ accessToken })
    })
  } catch (error) {
    console.log(error)
  }
}