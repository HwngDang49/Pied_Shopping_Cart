// dung server voi express.ts
import express from 'express'
import userRouter from './routes/users.routers'
import databaseService from './services/database.services'
import { defaultErrorHandler } from './middlewares/error.middlewares'
import mediaRouter from './routes/medias.routers'
import { initFolder } from './utils/file'
import staticRouter from './routes/static.routers'

const app = express()
const PORT = 3000
// run().catch(console.dir) //kết nối database
databaseService.connect()
//chạy initF
initFolder()
//server dùng 1 middleWare biến đổi req thành json
app.use(express.json()) //middleWare toàn cục
//server dung cai route da tao
app.use('/users', userRouter)
app.use('/medias', mediaRouter)
app.use('/static', staticRouter)
//xử lí lỗi tổng
app.use(defaultErrorHandler)

app.listen(PORT, () => {
  console.log('server BE dang chay tren PORT: ' + PORT)
})
