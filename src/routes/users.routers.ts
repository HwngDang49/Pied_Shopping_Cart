import express from 'express'
import {
  accessTokenValidator,
  forgotPasswordTokenValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValidator,
  updateMeValidator,
  verifyEmailTokenValidator
} from '~/middlewares/users.middlewares'
import {
  forgotPasswordController,
  getMeController,
  loginController,
  logoutController,
  registerController,
  resendEmailVerifyController,
  resetPasswordController,
  updateMeController,
  verifyEmailController,
  verifyForgotPasswordTokenController
} from '~/controllers/users.controllers'
import { wrapAsync } from '~/utils/handlers'
import { access } from 'fs'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { Request, Response } from 'express'
import { wrap } from 'module'
//tao route
const userRouter = express.Router()
//middleware function

//controller function

//khi gửi lên server là đang gửi chuỗi -> server phải biến nó thành object mới sài được

//chức năng đăng kí tài khoản
//email, password
//users/register req.body{email và password}

//mỗi lần build thì phải mô tả
/*
    Description: Register a new user
    Path: users/register/
    Method: Post
    Body:{
        name: string
        email: string
        password: string,
        confirm_password
        dateOfBirth: ISO8601
    }
*/
userRouter.post('/register', registerValidator, wrapAsync(registerController))

/*
    DES: LOGIN
    PATH: users/login/
    METHOD: POST
    BODY:{
        email: string,
        password: string    
    }
*/

//  // khi mà chọn chức năng login
//mdw sẽ kiểm tra email và pass có đầy đủ hong
userRouter.get('/login', (req, res) => {
  res.render('login')
})
userRouter.post('/login', loginValidator, wrapAsync(loginController))

/*
    DES: LOGOUT
    PATH: users/logout/
    METHOD: POST
    BODY:{
        refresh_token: string  
    }
    Header: {
    authorization: Bear access_token
    }
*/

//kiểm tra ac và rf thì nên kiểm tra riêng biệt nhau
//vì có rất nhiều chỗ cần kiểm tra ac

userRouter.post('/logout', accessTokenValidator, refreshTokenValidator, logoutController)

/*
    DES: verify-email: khi người dùng vào email bấm vào link để verify email
    họ sẽ gửi email_verify_token lên cho mình thông qua query
    PATH: users/verify-email/?email_verify_token=string
    METHOD: GET

*/
userRouter.get('/verify-email', verifyEmailTokenValidator, wrapAsync(verifyEmailController))

/*
    DES: Resend Email Verify
    họ sẽ gửi email_verify_token lên cho mình thông qua query
    PATH: users/resend-verify-email
    chức năng này cần đăng nhập để sử dụng, muốn biết thì phải thông qua access, qua đường
    METHOD: POST
    headers:{
        Authorization: 'Bearer <access token>'
    }

*/

userRouter.post('/resend-verify-email', accessTokenValidator, wrapAsync(resendEmailVerifyController))

/*
    DES: forgot-password
    khi mà ta bị quên mật khẩu thì ta sẽ không đăng nhập được, không có acc
    thứ duy nhất mà ta có thể cung cấp cho server là email
    PATH: users/forgot-password
    method: POST
    BODY:{
        email: string
    }
*/

userRouter.get('/forgot-password', (req, res) => {
  res.render('forgotPassword')
})

userRouter.post('/forgot-password', forgotPasswordValidator, wrapAsync(forgotPasswordController))

/*
    DES: verify link in email to reset password
    PATH: users/verify-forgot-password-token
    method: POST
    BODY:{
    forgot_password_token: string
    }
*/
userRouter.post(
  '/verify-forgot-password',
  forgotPasswordTokenValidator, //
  wrapAsync(verifyForgotPasswordTokenController)
)

/*
    DES: reset password
    PATH: users/reset-password
    method: POST
    BODY:{
    password: string
    confirm_password: string,
    forgot_password_token: string
    }
*/

userRouter.get('/reset-password', (req, res) => {
  const { forgot_password_token } = req.query
  res.render('resetPassword', { forgot_password_token })
})

userRouter.post(
  '/reset-password',
  resetPasswordValidator, //kiểm tra pass, confirm_pass,
  forgotPasswordTokenValidator, //forgot-password-token
  wrapAsync(resetPasswordController)
)

/*
    DES: get profile của user
    PATH: users/me
    method: POST
    header:{Autho}
*/

userRouter.post(
  '/me',
  accessTokenValidator, //
  wrapAsync(getMeController)
)

/*
des: update profile của user
path: '/me'
method: patch
Header: {Authorization: Bearer <access_token>}
body: {
  name?: string
  date_of_birth?: Date
  bio?: string // optional
  location?: string // optional
  website?: string // optional
  username?: string // optional
  avatar?: string // optional
  cover_photo?: string // optional}
*/

userRouter.patch(
  '/me',
  accessTokenValidator, // kiểm tra access token và biết ai muốn cập nhật
  updateMeValidator, // kiểm tra các field mà người dùng muốn cập nhật có hợp lệ hong
  wrapAsync(updateMeController) //tiến hành cập nhật
)

// userRouter.get('/index', (req, res) => {
//   res.render('index')
// })
export default userRouter
