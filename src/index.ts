// dung server voi express.ts
import express from 'express'
import userRouter from './routes/users.routers'
import databaseService from './services/database.services'
import { defaultErrorHandler } from './middlewares/error.middlewares'

const app = express()
const PORT = 3000
// run().catch(console.dir) //kết nối database
databaseService.connect()
//server dùng 1 middleWare biến đổi req thành json

app.set('view engine', 'ejs')
app.set('views', './views')
app.use(express.static('public'))

app.use(express.json()) //middleWare toàn cục
//server dung cai route da tao
app.use('/users', userRouter)

//xử lí lỗi tổng
app.use(defaultErrorHandler)

app.listen(PORT, () => {
  console.log('server BE dang chay tren PORT: ' + PORT)
})
