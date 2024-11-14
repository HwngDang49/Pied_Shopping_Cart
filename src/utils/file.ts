import { log } from 'console'
import { Request } from 'express'
import formidable, { File, Files } from 'formidable'
import fs from 'fs' //thư viện giúp thao tác với file trong máy tính
import path from 'path'
import { UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_DIR, UPLOAD_VIDEO_TEMP_DIR } from '~/constants/dir'

//hàm này kiểm tra thư mục lưu ảnh có chưa,
//chưa có thì tạo
export const initFolder = () => {
  //kiểm tra xem đường dẫn này có dẫn tới đâu khong
  //nếu không có thì là chưa có thư mục
  //=> cần tạo
  ;[UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_TEMP_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {
        recursive: true
      })
    }
  })
}

//là hàm nhận vào req và ép req đi qua lưới lọc của formidable
//để lấy các file
//và mình sẽ chỉ lấy các file nào là ảnh mà thôi
export const handleUploadImage = async (req: Request) => {
  //tạo lưới lọc
  const form = formidable({
    uploadDir: UPLOAD_IMAGE_TEMP_DIR,
    maxFiles: 4,
    maxFieldsSize: 300 * 1024 * 4, //300kb
    keepExtensions: true,
    filter: ({ name, originalFilename, mimetype }) => {
      //name: name || key : được truyền vào trong input tag
      //originalFilename: tên gốc của file
      // mimetype là định dạng kiểu của file
      // console.log(name, originalFilename, mimetype)

      //phải gửi file trong fields có name là image và kiểu file là image/
      const valid = name === 'image' && Boolean(mimetype?.includes('image/'))

      //nếu không valid thì bắn lổi về
      if (!valid) {
        form.emit('error' as any, new Error('File type not valid') as any)
      }

      return valid
    }
  })

  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err)
      if (!files.image) {
        return reject(new Error('Image is empty'))
      }
      return resolve(files.image as File[])
    })
  })
}

export const handleUploadVideo = async (req: Request) => {
  //tạo lưới lọc
  const form = formidable({
    uploadDir: UPLOAD_VIDEO_DIR,
    maxFiles: 1,
    maxFieldsSize: 1024 * 1024 * 50, //50mb
    keepExtensions: true,
    filter: ({ name, originalFilename, mimetype }) => {
      //name: name || key : được truyền vào trong input tag
      //originalFilename: tên gốc của file
      // mimetype là định dạng kiểu của file
      // console.log(name, originalFilename, mimetype)

      //phải gửi file trong fields có name là image và kiểu file là image/
      const valid = name === 'video' && Boolean(mimetype?.includes('video/'))

      //nếu không valid thì bắn lổi về
      if (!valid) {
        form.emit('error' as any, new Error('File type not valid') as any)
      }

      return valid
    }
  })

  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err)
      if (!files.video) {
        return reject(new Error('video is empty'))
      }
      return resolve(files.video as File[])
    })
  })
}

//HÀM TIỆN ÍCH, NHẬN VÀO FILENAME: hung.png

//lấy hung bỏ .png để sau này thêm .jpeg
export const getNameFromFullNameFile = (filename: string) => {
  const nameArr = filename.split('.')
  nameArr.pop()
  return nameArr.join('-')
}

export const getExtension = (filename: string) => {
  const nameArr = filename.split('.')
  nameArr.pop() // xóa và trả ra phần tử bị xóa(phần tử cuối)
}
