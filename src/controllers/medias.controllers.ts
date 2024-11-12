import { Request, Response, NextFunction } from 'express'
import formidable from 'formidable'
import path, { resolve } from 'path'

export const uploadSingleImageController = async (
  req: Request,
  res: Response, //
  next: NextFunction
) => {
  //test
  //__dirname: đường dẫn đến folder đang chạy file này
  //  console.log(path.resolve('uploads'))  : cung cấp đường dẫn đến thư mục mà mình muốn lưu trữ

  //tạo cái khung để khi người dùng gửi file lên sẽ
  //bị mình dùng khung đó để kiểm tra hay gọi là (ép kiểu)
  const form = formidable({
    maxFields: 1, //tối đa 1 file
    maxFieldsSize: 1024 * 300, // 1 hình tối đa 300kb
    keepExtensions: true, //giữ lại đuôi của file để kiểm tra sau
    uploadDir: path.resolve('uploads')
  })

  //đã chuẩn bị xong form để kiểm tra các file rồi
  //giờ mình sẽ dùng form để kiểm tra request người dùng gửi lên

  form.parse(req, (err, fields, files) => {
    //nhận vào 1 callback vì có khả năng thất bại
    //files là object chứa các file do người dùng gửi lên
    if (err) {
      throw err
    } else {
      res.json({
        message: 'Upload image successfully'
      })
    }
  })
}
