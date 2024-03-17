const express = require('express');
const morgan = require('morgan');

// 引入tourRoutes和userRoutes模块
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

// 创建express实例
const app = express();


// 如果环境变量为开发，则使用morgan中间件
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 使用express的json中间件
app.use(express.json());
// 使用express的静态文件中间件，将public文件夹作为静态文件服务器
app.use(express.static(`${__dirname}/public`));

// 打印中间件
app.use((req, res, next) => {
  console.log('Hello from the middleware 👋');
  next();
});

// 记录请求时间
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 3) ROUTES
// 使用tourRouter和userRouter模块的路由
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

module.exports = app;
