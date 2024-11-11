import { Request, Response, NextFunction, RequestHandler } from 'express'
//viết hàm wrapAsync
//  là hàm nhận vào req handler(mdw, controller)
//  'req handler' này k có cấu trúc try catch next
//  wrapAsync này sẽ nhận và trả về 1 req handler khác
//  được tạo từ try catch next và req handler ban đầu

export const wrapAsync = <P, T>(func: RequestHandler<P, any, any, T>) => {
  //đưa func và nhận được 1 req handler mới
  return async (req: Request<P, any, any, T>, res: Response, next: NextFunction) => {
    try {
      await func(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}