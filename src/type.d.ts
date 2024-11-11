//file này có khả năng ghi đè tất cả các thư viện code nhưng không gây ảnh hưởng
//nhập gia tùy bạn
import { TokenPayload } from './models/requests/User.requests'
import User from './models/schemas/User.schema'
import { Request } from 'express'
declare module 'express' {
  interface Request {
    decoded_authorization?: TokenPayload
    decoded_refresh_token?: TokenPayload
    decoded_email_verify_token?: TokenPayload
    decoded_forgot_password_token?: TokenPayload
    decoded_forgot_password_token?: TokenPayload
  }
}
