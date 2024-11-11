//function
//đoạn code này sẽ mã hóa nội dung nào đó thành sha256

import { createHash } from 'crypto'
import dotenv from 'dotenv'
//đoạn code này của gg
function sha256(content: string) {
  return createHash('sha256').update(content).digest('hex')
}

//hàm nhận vào password và mã hóa pass đó bằng hàm sha256 của mình
export function hashPassword(password: string) {
  return sha256(password + process.env.PASSWORD_SECRET)
}
