import { Request, Response, NextFunction } from 'express'
import { body, validationResult, ContextRunner, ValidationChain } from 'express-validator'
import { RunnableValidationChains } from 'express-validator/lib/middlewares/schema'
import HTTP_STATUS from '~/constants/httpStatus'
import { EntityError, ErrorWithStatus } from '~/models/Errors'

// hàm validate sẽ sài như sau: validate(checkSchema({...}))
//và checkSchema sẽ return RunnableValidationChains<ValidationChain>
//nên mình định nghĩa lại
export const validate = (validations: RunnableValidationChains<ValidationChain>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    //lỗi checkSchema ra để lấy danh sách lỗi
    await validations.run(req) //function này cũng lấy lỗi từ req trước
    const errors = validationResult(req) //lọc danh sách lỗi trong req // mảng

    if (errors.isEmpty()) {
      return next()
    } else {
      const errorsObject = errors.mapped() //danh sách các lỗi dạng object
      const entityError = new EntityError({ errors: {} }) //đây là object lỗi mà mình muốn thay thế
      //duyệt key
      for (const key in errorsObject) {
        //lấy msg trong từng trường dữ liệu của errorsObject ra
        const { msg } = errorsObject[key]
        //nếu msg có dạng ErrorWithStatus và có dạng status khác 422 thì mình next(err) nó ra trước
        if (msg instanceof ErrorWithStatus && msg.status != HTTP_STATUS.UNPROCESSABLE_ENTITY) {
          return next(msg)
        }
        //nếu không phải dạng đặc biệt thì bỏ vào entityError
        entityError.errors[key] = msg
      }
      next(entityError)
    }
  }
}
