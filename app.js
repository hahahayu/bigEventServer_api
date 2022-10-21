// 导入 express 模块
const express = require('express')
// 创建 express 的服务器实例
const app = express()
// 
const joi = require('joi')
// 导入 cors 中间件
const cors = require('cors')
// 将 cors 注册为全局中间件
app.use(cors())
// 导入配置文件
const config = require('./config')
// 解析 token 的中间件
const expressJWT = require('express-jwt')
// 使用 .unless({ path: [/^\/api\//] }) 指定哪些接口不需要进行 Token 的身份认证
app.use(expressJWT({ secret: config.jwtSecretKey, algorithms: ["HS256"] }).unless({ path: [/^\/api\//] }))

// 配置解析 application/x-www-form-urlencoded 格式的表单数据的中间件：
app.use(express.urlencoded({ extended: false }))

// 在处理函数中，需要多次调用 res.send() 向客户端响应 处理失败 的结果，为了简化代码
// 所有路由之前，声明一个全局中间件，为 res 对象挂载一个 res.cc() 函数 ：
app.use((req, res, next) => {
    // status = 0 为成功； status = 1 为失败； 默认将 status 的值设置为 1，方便处理失败的情况
    res.cc = (err, status = 1) => {
        res.send({
            status,
            // 判断 err 是 错误对象 还是 字符串
            message: err instanceof Error ? err.message : err
        })
    }
    next()
})



// 导入并注册用户路由模块
const userRouter = require('./router/user')
app.use('/api', userRouter)

// 导入并使用用户信息路由模块
const userinfoRouter = require('./router/userinfo')
// 注意：以 /my 开头的接口，都是有权限的接口，需要进行 Token 身份认证
app.use('/my', userinfoRouter)



// 在 app.js 的全局错误级别中间件中，捕获验证失败的错误，并把验证失败的结果响应给客户端
// 错误中间件
app.use(function (err, req, res, next) {
    // 账号数据验证失败
    if (err instanceof joi.ValidationError) return res.cc(err)
    // 捕获并处理 Token 认证失败后的错误
    if (err.name === 'UnauthorizedError') return res.cc('身份认证失败！')


    // 未知错误
    res.cc(err)
})

// 调用 app.listen 方法，指定端口号并启动web服务器
app.listen(3007, function () {
    console.log('api server running at http://127.0.0.1:3007')
})