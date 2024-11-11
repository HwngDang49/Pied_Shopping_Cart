import User from '~/models/schemas/User.schema'
import databaseService from './database.services'
import { RegisterReqBody, UpdateMeReqBody } from '~/models/requests/User.requests'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenType, UserVerifyStatus } from '~/constants/enums'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/messages'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { ObjectId } from 'mongodb'
import { update } from 'lodash'

class UsersServices {
  private signAccessToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.AccessToken },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
      options: { expiresIn: process.env.ACCESS_TOKEN_EXPIRE_IN }
    })
  } //mặc dù là promise nhưng mà chưa sài nên chưa để await

  private signRefreshToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.RefreshToken },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      options: { expiresIn: process.env.REFRESH_TOKEN_EXPIRE_IN }
    })
  } //mặc dù là promise nhưng mà chưa sài nên chưa để await

  private signEmailVerifyToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.EmailVerificationToken },
      privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string,
      options: { expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRE_IN }
    })
  } //mặc dù là promise nhưng mà chưa sài nên chưa để await

  private signForgotPasswordToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.ForgotPasswordToken },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string,
      options: { expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRE_IN }
    })
  } //mặc dù là promise nhưng mà chưa sài nên chưa để await

  async checkEmailExist(email: string) {
    //vào db tìm user sở hữu email đó
    //nếu có thì có người sài rồi
    const user = await databaseService.users.findOne({ email })
    return Boolean(user) //nếu tìm k được trả ra null return Boolean(null)=>false
  }

  async checkRefreshToken({ user_id, refresh_token }: { user_id: string; refresh_token: string }) {
    const refreshToken = await databaseService.refreshTokens.findOne({
      user_id: new ObjectId(user_id),
      token: refresh_token
    })
    if (!refreshToken) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.UNAUTHORIZED,
        message: USERS_MESSAGES.REFRESH_TOKEN_IS_REQUIRED
      })
    } else {
      return refreshToken
    }
  }

  async checkEmailVerifyToken({
    user_id,
    email_verify_token
  }: {
    user_id: string
    email_verify_token: string //
  }) {
    //tìm user bằng user_id và email_verify_token
    const user = await databaseService.users.findOne({
      _id: new ObjectId(user_id),
      email_verify_token
    })
    if (!user) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
        message: USERS_MESSAGES.EMAIL_VERIFY_TOKEN_IS_INVALID
      })
    }

    return user // return ra ngoài để kiểm tra verify hay gì không
  }

  async findUserById(user_id: string) {
    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
    if (!user) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.NOT_FOUND,
        message: USERS_MESSAGES.USER_NOT_FOUND
      })
    } else {
      return user //thay cho true
    }
  }

  async register(payload: RegisterReqBody) {
    //gọi db và tạo user từ email và password xong nhét vào collection users
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken(user_id.toString())
    const result = await databaseService.users.insertOne(
      new User({
        _id: user_id,
        email_verify_token,
        ...payload,
        password: hashPassword(payload.password),
        date_of_birth: new Date(payload.date_of_birth)
      })
    )
    //dùng user_id ký 2 mã ac và rf
    const [access_token, refresh_token] = await Promise.all([
      this.signAccessToken(user_id.toString()),
      this.signRefreshToken(user_id.toString())
    ])
    //gui link co email_verify_token qua email
    console.log(`mô phỏng gửi link qua mail xác thực đăng ký:
    http://localhost:3000/users/verify-email/?email_verify_token=${email_verify_token}
    `)

    //sau khi tạo thành công thì lưu refresh vào luôn
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token
      })
    )
    return {
      access_token,
      refresh_token
    }
  }

  async login({ email, password }: { email: string; password: string }) {
    //dùng 2 thông tin này để tìm user
    //lúc mình lưu lên db thì mình hash cái password nên nếu mà mình viết password luôn thì bị gõ
    const user = await databaseService.users.findOne({
      email,
      password: hashPassword(password)
    })

    if (!user) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
        message: USERS_MESSAGES.EMAIL_OR_PASSWORD_IS_INCORRECT
      })
    }
    //nếu thành công
    //thì tạo ac và rf token cho user
    const user_id = user._id.toString()
    //combo
    const [access_token, refresh_token] = await Promise.all([
      this.signAccessToken(user_id),
      this.signRefreshToken(user_id)
    ])

    //lưu refresh luôn
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token
      })
    )
    return {
      access_token,
      refresh_token
    }
  }

  async logout(refresh_token: string) {
    await databaseService.refreshTokens.deleteOne({ token: refresh_token })
  }

  async verifyEmail(user_id: string) {
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          verify: UserVerifyStatus.Verified,
          email_verify_token: '',
          updated_at: '$$NOW'
        }
      }
    ])
    //TẠO ACC VÀ RF ĐỂ NGƯỜI DÙNG ĐĂNG NHẬP LUÔN
    const [access_token, refresh_token] = await Promise.all([
      this.signAccessToken(user_id),
      this.signRefreshToken(user_id)
    ])

    //lưu refresh luôn
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token
      })
    )
    return {
      access_token,
      refresh_token
    }
  }

  async resendEmailVerify(user_id: string) {
    //tạo lại mã evt
    const email_verify_token = await this.signEmailVerifyToken(user_id)
    //tìm user bằng user_id đa cập nhật lại
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      [
        {
          $set: {
            email_verify_token,
            uupdated_at: '$$NOW'
          }
        }
      ]
    )
    console.log(`mô phỏng gửi link qua mail xác thực đăng ký:
      http://localhost:3000/users/verify-email/?email_verify_token=${email_verify_token}
      `)
  }

  async forgotPassword(email: string) {
    const user = (await databaseService.users.findOne({
      email
    })) as User

    //lấy user_id tạo mã forgot_password_token
    const user_id = user._id as ObjectId
    const forgot_password_token = await this.signForgotPasswordToken(user_id.toString())
    //lưu vào database
    await databaseService.users.updateOne({ _id: user_id }, [
      {
        $set: {
          forgot_password_token,
          updated_at: '$$NOW'
        }
      }
    ])

    console.log(`
      mô phỏng gửi link qua mail để đổi mật khẩu:
      http://localhost:8000/reset-password/?forgot_password_token=${forgot_password_token}
    `)
  }

  async resetPassword({ user_id, password }: { user_id: string; password: string }) {
    //tìm user có id này và cập nhật
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) }, //tìm
      [
        {
          $set: {
            password: hashPassword(password),
            forgot_password_token: '',
            updated_at: '$$NOW'
          }
        }
      ]
    )
  }

  async getMe(user_id: string) {
    const user = await databaseService.users.findOne(
      { _id: new ObjectId(user_id) },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    if (!user) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.NOT_FOUND,
        message: USERS_MESSAGES.USER_NOT_FOUND
      })
    }

    return user
  }

  async updateMe({
    user_id,
    payload
  }: {
    user_id: string //
    payload: UpdateMeReqBody
  }) {
    //trong payload có 2 trường dữ liệu cần xử lí
    //date_of_birth
    const _payload = payload.date_of_birth ? { ...payload, date_of_birth: new Date(payload.date_of_birth) } : payload
    //user_name
    if (_payload.username) {
      //nếu có thì tìm xem có ai bị trùng không
      const user = await databaseService.users.findOne({ username: _payload.username })
      if (user) {
        throw new ErrorWithStatus({
          status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
          message: USERS_MESSAGES.USERNAME_ALREADY_EXISTS
        })
      }
    }
    //nếu username truyền lên mà ok thì sẽ tiến hành cập nhật
    const user = await databaseService.users.findOneAndUpdate(
      //
      { _id: new ObjectId(user_id) }, //
      [
        {
          $set: {
            ..._payload,
            updated_at: '$$NOW'
          }
        }
      ],
      {
        returnDocument: 'after',
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_toke: 0
        }
      } //cập nhật xong thì đưa user cập nhật về
    )
    return user
  }
}

//tạo instance
const usersServices = new UsersServices()
export default usersServices
