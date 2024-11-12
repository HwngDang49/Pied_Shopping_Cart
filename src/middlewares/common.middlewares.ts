import { pick } from 'lodash'
import { Request, Response, NextFunction } from 'express'
//hàm nhận vào 1 cái mảng những thuộc tính cần lấy trả ra promise
export const filterMiddleware = <T>(filterKeys: Array<keyof T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    req.body = pick(req.body, filterKeys)
    next()
  }
}
