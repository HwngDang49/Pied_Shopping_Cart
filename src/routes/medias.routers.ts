import { Router } from 'express'
import { uploadImageController, uploadVideoController } from '~/controllers/medias.controllers'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import { wrapAsync } from '~/utils/handlers'
const mediaRouter = Router()

//làm 1 route cho người dùng upload file lên

mediaRouter.post('/upload-image', accessTokenValidator, wrapAsync(uploadImageController))

mediaRouter.post('/upload-video', accessTokenValidator, wrapAsync(uploadVideoController))
export default mediaRouter
