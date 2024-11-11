//controller là handler điều phối các dữ liệu vào đúng với các service xử lí
//trích xuất dữ liệu với server

//bình dân: controller là nơi xử lí logic
//chỉ có services nói chuyện với db
import exp from 'constants'
import { NextFunction, Request, Response } from 'express'
import {
  ForgotPasswordReqBody,
  LoginReqBody,
  LogoutReqBody,
  RegisterReqBody,
  ResetPasswordRedBody,
  TokenPayload,
  UpdateMeReqBody,
  verifyEmailReqQuery,
  VerifyForgotPasswordTokenReqBody
} from '~/models/requests/User.requests'
import User from '~/models/schemas/User.schema'
import databaseService from '~/services/database.services'
import usersServices from '~/services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/messages'
import { UserVerifyStatus } from '~/constants/enums'
//dữ liệu khi đến tầng này thì phải clean

export const registerController = async (
  req: Request<ParamsDictionary, any, RegisterReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { email } = req.body
  //gọi database tạo user từ email, password và lưu vào collection users
  // throw new Error('lỗi rớt mạng') //test
  const isEmailExist = await usersServices.checkEmailExist(email)
  if (isEmailExist) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY, //422
      message: USERS_MESSAGES.EMAIL_ALREADY_EXISTS
    })
  }
  const result = await usersServices.register(req.body)

  res.status(201).json({
    message: USERS_MESSAGES.REGISTER_SUCCESS,
    data: result
  })
}

export const loginController = async (
  req: Request<ParamsDictionary, any, LoginReqBody>,
  res: Response,
  next: NextFunction
) => {
  //ở tầng này thì đã có email và password
  //dùng email và password để tìm user
  //nếu không có user thì nghỉ chơi
  //nếu có user thì tạo access và rf token và WELCOME
  const { email, password } = req.body

  //muốn kiểm tra phải thông qua service
  const result = await usersServices.login({ email, password })

  res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.LOGIN_SUCCESS,
    result
  })
}

export const logoutController = async (
  req: Request<ParamsDictionary, any, LogoutReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { refresh_token } = req.body
  // vào đến đây thì nghĩa là 2 token kia do mình ký ra (ko làm này là bị phá cht cdm luôn đó)
  // xem thử là thông tin user_id trong payload của access và
  //      user_id trong payload của refresh cỏa phải là 1 không?
  const { user_id: user_id_at } = req.decoded_authorization as TokenPayload
  const { user_id: user_id_rf } = req.decoded_refresh_token as TokenPayload
  // chặn việc gửi 2 mã của 2 thằng khác nhau (cô hồn 1)
  if (user_id_at != user_id_rf) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.UNAUTHORIZED, //401
      message: USERS_MESSAGES.REFRESH_TOKEN_IS_REQUIRED
    })
  }
  // nó gửi 1 cái refresh_token cũ và k còn tồn tại trong database nữa
  // vào database tìm xhem document(hàng) nào chứa refresh_token này và có phải là user đó không
  await usersServices.checkRefreshToken({ user_id: user_id_rf, refresh_token })
  // nếu mà có thì mới xóa khỏi database
  await usersServices.logout(refresh_token)
  // nếu code xuống ddwuwojc đây mượt, k có con bug nào
  res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.LOGOUT_SUCCESS
  })
}

export const verifyEmailController = async (
  req: Request<ParamsDictionary, any, any, verifyEmailReqQuery>,
  res: Response,
  next: NextFunction
) => {
  //vào tới controller thì nghĩa là email_verify_token đã được kí thành công
  const { email_verify_token } = req.query
  const { user_id } = req.decoded_email_verify_token as TokenPayload
  //kiểm tra xem user_id và email_verify_token có tồn tại trong database hay k
  const user = await usersServices.checkEmailVerifyToken({ user_id, email_verify_token })
  //kiểm tra xem người dùng có phải là unverify hay không,
  if (user.verify == UserVerifyStatus.Verified) {
    res.status(HTTP_STATUS.OK).json({
      message: USERS_MESSAGES.EMAIL_HAS_BEEN_VERIFIED
    })
  } else if (user.verify == UserVerifyStatus.Banned) {
    res.status(HTTP_STATUS.OK).json({
      message: USERS_MESSAGES.EMAIL_HAS_BEEN_BANNED
    })
  } else {
    //tiến hành verifyEmail
    const result = await usersServices.verifyEmail(user_id)
    res.status(HTTP_STATUS.OK).json({
      message: USERS_MESSAGES.VERIFY_EMAIL_SUCCESS,
      result //chính là ac và rf để người ta đăng nhập luôn
    })
  }
  //nếu ok hết thì tiến hành verify email
}

export const resendEmailVerifyController = async (
  req: Request<ParamsDictionary, any, any>,
  res: Response,
  next: NextFunction
) => {
  //lấy user_id tìm xem user này còn tồn tại không
  const { user_id } = req.decoded_authorization as TokenPayload
  const user = await usersServices.findUserById(user_id)
  //từ user đó xem thử nó đã verify bị band hay là chưa verify\
  if (user.verify == UserVerifyStatus.Verified) {
    res.status(HTTP_STATUS.OK).json({
      message: USERS_MESSAGES.EMAIL_HAS_BEEN_VERIFIED
    })
  } else if (user.verify == UserVerifyStatus.Banned) {
    res.status(HTTP_STATUS.OK).json({
      message: USERS_MESSAGES.EMAIL_HAS_BEEN_BANNED
    })
  } else {
    //tiến hành verifyEmail
    await usersServices.resendEmailVerify(user_id)
    res.status(HTTP_STATUS.OK).json({
      message: USERS_MESSAGES.RESEND_EMAIL_VERIFY_TOKEN_SUCCESS
    })
  }
  //chưa verify thì mới resendEmailVerify cho
}

export const forgotPasswordController = async (
  req: Request<ParamsDictionary, any, ForgotPasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  //người dùng cung cấp email cho mình làm gì
  //mình kiểm tra email có tồn tại trong db hay không
  //nếu có thì: mình tạo token và mình gửi
  const { email } = req.body
  //kiểm tra email có tồn tại trong db không
  const hasEmail = await usersServices.checkEmailExist(email)
  if (!hasEmail) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.NOT_FOUND,
      message: USERS_MESSAGES.USER_NOT_FOUND
    })
  } else {
    //có thì mình sẽ tạo và gửi
    await usersServices.forgotPassword(email)
    res.status(HTTP_STATUS.OK).json({
      message: USERS_MESSAGES.CHECK_EMAIL_TO_RESET_PASSWORD
    })
  }
}

export const verifyForgotPasswordTokenController = async (
  req: Request<ParamsDictionary, any, VerifyForgotPasswordTokenReqBody>,
  res: Response,
  next: NextFunction
) => {
  //FE đã gửi lên forgotPasswordToken cho mình để kiểm tra xem cái này còn thuộc quyền sở hữu của user đó k
  //mình chỉ cần tìm xem forgotPasswordToken và user_id trong Payload còn sở hữu k
  const { forgot_password_token } = req.body
  const { user_id } = req.decoded_forgot_password_token as TokenPayload
  //tìm user và xem thử user đó có forgot_password_token
  const user = await usersServices.findUserById(user_id)
  if (!user) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.NOT_FOUND,
      message: USERS_MESSAGES.USER_NOT_FOUND
    })
  }

  //kiểm tra nếu có user thì xem thử forgot_password_token người ta gửi lên có khớp k
  if (user.forgot_password_token !== forgot_password_token) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.UNAUTHORIZED,
      message: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_NOT_MATCH
    })
  }
  //còn lại thì ok
  res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.VERIFY_FORGOT_PASSWORD_TOKEN_SUCCESS
  })
}

export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, ResetPasswordRedBody>,
  res: Response,
  next: NextFunction
) => {
  //FE đã gửi lên forgotPasswordToken cho mình để kiểm tra xem cái này còn thuộc quyền sở hữu của user đó k
  //mình chỉ cần tìm xem forgotPasswordToken và user_id trong Payload còn sở hữu k
  const { forgot_password_token, password } = req.body
  const { user_id } = req.decoded_forgot_password_token as TokenPayload
  //tìm user và xem thử user đó có forgot_password_token
  const user = await usersServices.findUserById(user_id)
  if (!user) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.NOT_FOUND,
      message: USERS_MESSAGES.USER_NOT_FOUND
    })
  }

  //kiểm tra nếu có user thì xem thử forgot_password_token người ta gửi lên có khớp k
  if (user.forgot_password_token !== forgot_password_token) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.UNAUTHORIZED,
      message: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_NOT_MATCH
    })
  }
  //cập nhật lại mật khẩu cho người ta
  await usersServices.resetPassword({ user_id, password })
  res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.RESET_PASSWORD_SUCCESS
  })
}

export const getMeController = async (
  req: Request<ParamsDictionary, any, any>,
  res: Response, //
  next: NextFunction
) => {
  //trong access_token mà người dùng gửi lên thì chắc chắn mình decode sẽ có
  //decode_authorization => tìm được user_id => user
  const { user_id } = req.decoded_authorization as TokenPayload

  const userInfo = await usersServices.getMe(user_id)
  res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.GET_ME_SUCCESS,
    result: userInfo
  })
}

export const updateMeController = async (
  req: Request<ParamsDictionary, any, UpdateMeReqBody>,
  res: Response, //
  next: NextFunction
) => {
  //muốn người dùng gửi acc để biết họ là ai
  const { user_id } = req.decoded_authorization as TokenPayload
  const user = await usersServices.findUserById(user_id)
  // và họ còn gửi rất nhiều thông tin muốn update trong body
  if (user.verify !== UserVerifyStatus.Verified) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.UNAUTHORIZED,
      message: USERS_MESSAGES.EMAIL_HAS_BEEN_UNVERIFIED
    })
  }

  //tiến hành cập nhật = tất cả gì client bỏ vào body
  const { body } = req
  const userInfo = await usersServices.updateMe({ user_id, payload: body })
  res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.UPDATE_PROFILE_SUCCESS,
    result: userInfo
  })
}
