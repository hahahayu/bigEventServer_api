/**
 * 在这里定义和用户相关的路由处理函数，供 /router/user.js 模块进行调用
 */

// 导入数据库操作模块
const db = require('../db/index')
// 使用 bcryptjs 对用户密码进行加密
const bcrypt = require('bcryptjs')
// 用这个包来生成 Token 字符串
const jwt = require('jsonwebtoken')
// 导入配置文件
const config = require('../config')

// 注册用户的处理函数
exports.regUser = (req, res) => {
    // 接收表单数据
    const userinfo = req.body
    // 判断数据是否合法
    if (!userinfo.username || !userinfo.password) {
        // return res.send({ status: 1, message: '用户名或密码不能为空！' })
        return res.cc('用户名或密码不能为空！')
    }

    // 定义 SQL 语句，查询用户名是否被占用
    const selectUsernameReg = `select * from ev_users where username=?`
    db.query(selectUsernameReg, [userinfo.username], (err, results) => {
        // 执行 SQL 语句失败
        if (err) {
            // return res.send({ status: 1, message: err.message })
            return res.cc(err)
        }
        // 用户名被占用
        if (results.length > 0) {
            return res.cc('用户名被占用，请更换其他用户名！')
        }
        // bcrypt.hashSync(明文密码, 随机盐的长度)
        // 对用户的密码,进行 bcrype 加密，返回值是加密之后的密码字符串
        userinfo.password = bcrypt.hashSync(userinfo.password, 10)

        // 插入新用户
        const insertUsernameReg = 'insert into ev_users set ?'
        db.query(insertUsernameReg, { username: userinfo.username, password: userinfo.password }, (err, results) => {
            if (err) return res.send({ status: 1, message: err.message })
            // SQL 语句执行成功，但影响行数不为 1
            if (results.affectedRows !== 1) {
                return res.cc('注册用户失败，请稍后再试！')
            }
            // 
            return res.cc('注册成功！', 0)
        })
    })
}

// 登录的处理函数
exports.login = (req, res) => {
    const userinfo = req.body  // 接收表单数据
    const selectUsernameLogin = `select * from ev_users where username=?` // 定义 SQL 语句
    db.query(selectUsernameLogin, userinfo.username, (err, results) => {
        if (err) return res.cc(err) // 执行 SQL 语句失败
        if (results.length !== 1) return res.cc('用户名不存在！') // 执行 SQL 语句成功，但是查询到数据条数不等于 1
        // 调用 bcrypt.compareSync(用户提交的密码, 数据库中的密码) 方法比较密码是否一致
        // 返回值是布尔值（true 一致、false 不一致）
        const compareResult = bcrypt.compareSync(userinfo.password, results[0].password)
        // 如果对比的结果等于 false, 则证明用户输入的密码错误
        if (!compareResult) {
            return res.cc('密码错误！')
        }
        // 通过 ES6 的高级语法，快速剔除 密码 和 头像 的值：
        // 剔除完毕之后，user 中只保留了用户的 id, username, nickname, email 这四个属性的值
        const user = { ...results[0], password: '', user_pic: '' }  // ...results[0]  展开语法
        // 生成 Token 字符串, jwt.sign()  三个参数： 用户信息对象， 加密密钥， 配置对象
        const tokenStr = jwt.sign(user, config.jwtSecretKey, {
            expiresIn: '10h', // token 有效期为 10 个小时
        })
        // 将生成的 Token 字符串响应给客户端
        res.send({
            status: 0,
            message: '登录成功！',
            // 为了方便客户端使用 Token，在服务器端直接拼接上 Bearer 的前缀
            token: 'Bearer ' + tokenStr,
        })
    })
}