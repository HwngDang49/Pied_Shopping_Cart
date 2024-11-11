//định nghĩa hàm handler tổng
//nơi mà các lỗi tử toàn bộ hệ thống sẽ đổ về đây
//lỗi từ validate đổ về sẽ có mã 422 mình có thể tận dụng
//      EntityError {status, message, errors}
//      đôi khi trong validate có lỗi đặc biệt có dạng ErrorWStatus
//lỗi từ controller có thể là lỗi do mình ErrorWStatus
//      lỗi rớt mạng thì không có status nào
//lỗi từ các nơi đổ về có thể có hoặc không có status

import { omit } from 'lodash'
import HTTP_STATUS from '~/constants/httpStatus'
import { Request, Response, NextFunction } from 'express'
import { ErrorWithStatus } from '~/models/Errors'

export const defaultErrorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof ErrorWithStatus) {
    res.status(error.status).json(omit(error, ['status']))
  } else {
    //còn những lối khác thì nó có nhiều thuộc tính mình không biết nhưng
    //có thể sẽ có stack nhưng k có status
    //bước 1: chỉnh hết các key trong obj về enumerable true
    Object.getOwnPropertyNames(error).forEach((key) => {
      Object.defineProperty(error, key, { enumerable: true })
    }) // lấy ra danh sách các thuộc tính (mảng)

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(omit(error, ['stack']))
  }
}
