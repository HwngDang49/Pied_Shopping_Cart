import fs from 'fs' //thư viện giúp thao tác với file trong máy tính
import path from 'path'

//hàm này kiểm tra thư mục lưu ảnh có chưa,
//chưa có thì tạo
export const initFolder = () => {
  //chuẩn bị đường dẫn tới thư mục lưu ảnh
  const uploadsFolderPath = path.resolve('uploads')

  //kiểm tra xem đường dẫn này có dẫn tới đâu khong
  //nếu không có thì là chưa có thư mục
  //=> cần tạo

  if (!fs.existsSync(uploadsFolderPath)) {
    fs.mkdirSync(uploadsFolderPath, {
      recursive: true
    })
  }
}
