import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { reject } from 'lodash'
import { resolve } from 'path'
import { TokenPayload } from '~/models/requests/User.requests'
dotenv.config()
//file này chứa hàm dùng đẻ tạo ra token bằng công nghệ jwt
// hàm chỉ tạo ra token chứ không phải tạo ra aces hay rf token
export const signToken = ({
  payload,
  privateKey,
  options = { algorithm: 'HS256' } //nếu để trống sẽ được (default)
}: {
  payload: string | object | Buffer
  privateKey: string //được quyền để trống
  options: jwt.SignOptions
}) => {
  return new Promise<string>((resolve, reject) => {
    jwt.sign(payload, privateKey, options, (error, token) => {
      if (error) throw reject(error)
      else resolve(token as string)
    })
  })
}

export const verifyToken = ({ token, privateKey }: { token: string; privateKey: string }) => {
  return new Promise<TokenPayload>((resolve, reject) => {
    jwt.verify(token, privateKey, (error, decode) => {
      if (error) {
        throw reject(error)
      } else {
        return resolve(decode as TokenPayload)
      }
    })
  })
}
