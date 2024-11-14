import { Request } from 'express'
import sharp from 'sharp'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import { getNameFromFullNameFile, handleUploadImage, handleUploadVideo } from '~/utils/file'
import fs from 'fs'
import { MediaType } from '~/constants/enums'
import { Media } from '~/models/Other'
class MediasServices {
  async handleUploadImage(req: Request) {
    //test
    //__dirname: đường dẫn đến folder đang chạy file này
    //  console.log(path.resolve('uploads'))  : cung cấp đường dẫn đến thư mục mà mình muốn lưu trữ

    //tạo cái khung để khi người dùng gửi file lên sẽ
    //bị mình dùng khung đó để kiểm tra hay gọi là (ép kiểu)
    const files = await handleUploadImage(req) // thu hoạch file tử req
    const result = await Promise.all(
      files.map(async (file) => {
        const newFileName = getNameFromFullNameFile(file.newFilename) + '.jpg' //đặt tên mới
        const newPath = UPLOAD_IMAGE_DIR + '/' + newFileName
        //optimize bức hình
        const infor = await sharp(file.filepath).jpeg().toFile(newPath)

        fs.unlinkSync(file.filepath) // xóa file tạm
        //cung cấp route link để người dùng xem hình vừa up
        return {
          url: `http://localhost:3000/static/image/${newFileName}`,
          type: MediaType.Image
        } as Media
      })
    )

    return result
  }

  async handleUploadVideo(req: Request) {
    //test
    //__dirname: đường dẫn đến folder đang chạy file này
    //  console.log(path.resolve('uploads'))  : cung cấp đường dẫn đến thư mục mà mình muốn lưu trữ

    //tạo cái khung để khi người dùng gửi file lên sẽ
    //bị mình dùng khung đó để kiểm tra hay gọi là (ép kiểu)
    const files = await handleUploadVideo(req) // thu hoạch file tử req
    const result = await Promise.all(
      files.map(async (file) => {
        const newFileName = file.newFilename
        const newPath = UPLOAD_VIDEO_DIR + '/' + newFileName
        //optimize bức hình

        //cung cấp route link để người dùng xem hình vừa up
        return {
          url: `http://localhost:3000/static/video/${newFileName}`,
          type: MediaType.Video
        } as Media
      })
    )

    return result
  }
}

const mediasServices = new MediasServices()
export default mediasServices
