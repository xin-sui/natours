const express = require('express');
const morgan = require('morgan');
// 限制请求频率
const ratelimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const helmet = require('helmet');
const hpp = require('hpp');
// 引入AppError类，用于处理应用错误
const AppError = require('./utils/appError');
// 引入tourRoutes和userRoutes模块
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
// 引入全局错误处理模块
const globalErrorHandler = require('./controllers/errorController');
// 创建express实例
const app = express();
// 设置安全头部
app.use(helmet());
// 开发日志
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 限制请求频率
const limiter = ratelimit({
  max: 100, // 每个IP地址每分钟最多100个请求
  windowMs: 60 * 60 * 1000, // 限制时间窗口为1分钟
  message: '请求频率太高，请稍后再试' // 当请求频率超过限制时返回的错误信息
});
// 使用limiter中间件
app.use('/api', limiter);
// 使用express的json中间件
app.use(express.json({ limit: '10kb' }));
// 清理数据 防止跨脚本攻击 去除用户输入中的特殊字符 如$
app.use(mongoSanitize());
// 清理数据 防止跨站脚本攻击
app.use(xss()); //去除html文本
// 使用express的静态文件中间件，将public文件夹作为静态文件服务器
app.use(express.static(`${__dirname}/public`));
// 清理数据 去除查询字符串中重复的参数
app.use(
  hpp({
    whitelist: [
      'discount',
      'ratingsQuantity',
      'ratingsAverage ',
      'duration',
      'maxGroupSize',
      'difficulty',
      'price'
    ] // 设置白名单，允许的参数
  })
); //去除查询字符串中多余的参数
// 记录请求时间 测试中间件
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.originalUrl);
  next();
});

// 3) ROUTES
// 使用tourRouter和userRouter模块的路由
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/review', reviewRouter);
//所有http方法 处理路由不匹配的时候
app.all('*', (req, res, next) => {
  next(new AppError(`在服务器没有找到${req.originalUrl}`));
});
console.log(process.env.NODE_ENV);
//全局中间件错误函数
app.use(globalErrorHandler);
module.exports = app;
