const { promisify } = require('util');
const jwt = require('jsonwebtoken'); // 导入jsonwebtoken库
const crypto = require('crypto');
const User = require('./../models/userModel'); // 导入用户模型
const catchAsync = require('../utils/catchAsync'); // 导入异步异常处理中间件
const AppError = require('../utils/appError'); // 导入自定义错误类
const sendEmail = require('../utils/email');

// 生成JWT令牌
const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// 生成JWT令牌
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    secure: true, // 设置为true表示只在https连接下发送cookie
    httpOnly: true // 设置为true表示客户端无法通过document.cookie访问cookie
  };
  if (process.NODE_ENV === 'development') cookieOptions.secure = false;
  // 发送响应
  // if (process.env.NODE_ENV === 'production') {
  //   // 如果是生产环境，设置secure属性为true
  //   cookieOptions.secure = true;
  // }
  //  删除密码字段
  user.password = undefined;
  // 发送cookie
  res.cookie('jwt', token, cookieOptions);
  // 发送成功响应
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: user
    }
  });
};

// 用户注册处理函数
exports.signup = catchAsync(async (req, res, next) => {
  // 创建新用户
  const newUser = await User.create(req.body);
  createSendToken(newUser, 201, res);
});

// 用户登录处理函数
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 如果缺少邮箱或密码，则返回错误
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // 根据邮箱查找用户，并选择密码字段
  const user = await User.findOne({ email }).select('+password');

  // 如果用户不存在或密码不正确，则返回错误
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('邮箱或者密码错误', 401));
  }

  createSendToken(user, 201, res);
});

// 检查token
exports.protect = catchAsync(async (req, res, next) => {
  // 1. 获取token 检查是否存在
  // 声明变量token
  let token;

  // 如果请求头中有authorization且以Bearer开头
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // 将authorization切割空格取第二个值赋值给token
    token = req.headers.authorization.split(' ')[1];
  }

  // 如果token不存在
  if (!token || token === 'undefined') {
    // 返回错误，提示未登录，需要登录才能访问
    return next(new AppError('你还没有登陆，请先登录', 401));
  }

  // 2. 验证token是否有效
  // 使用 promisify 将 jwt.verify 方法转换为返回 Promise 的形式，以便异步处理
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3. 检查用户是否存在
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    // 如果用户不存在，返回错误信息
    return next(new AppError('用户不存在', 401));
  }

  // 4. 检查用户是否更改过密码
  // 调用用户模型中的 changedPasswordAfter 方法检查用户是否在 token 签发时间之后更改过密码
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    // 如果用户更改过密码，返回错误信息
    return next(new AppError('用户密码已更改，请重新登录', 401));
  }

  // 将用户信息存储在请求对象中，以便后续中间件函数使用
  req.user = currentUser;
  console.log(currentUser);
  // 如果以上验证通过，继续执行下一个中间件函数
  next();
});

//权限检查
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // 检查用户角色是否在允许的角色列表中
    if (!roles.includes(req.user.role)) {
      return next(new AppError('你没有权限执行此操作', 403));
    }
    next();
  };
};

//忘记密码
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1. 获取用户
  const user = await User.findOne({
    email: req.body.email
  });
  if (!user) {
    return next(new AppError('没有该邮箱的用户', 404));
  }
  //2. 生成随机重置密码token
  const resetToken = user.createPasswordResetToken();
  // 保存用户 validateBeforeSave: false 停止所有的验证
  await user.save({
    validateBeforeSave: false
  });
  //3. 发送邮件
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;
  const message = `你的重置密码链接是: \n\n ${resetURL} \n\n 如果这不是你的请求，请忽略此邮件`;
  try {
    await sendEmail({
      email: user.email,
      subject: '你的重置密码链接',
      message
    });
    res.status(200).json({
      status: 'success',
      message: '重置密码链接已发送至你的邮箱'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({
      validateBeforeSave: false
    });
    return next(new AppError('发送邮件失败，请稍后再试', 500));
  }
});

// 重置密码
exports.resetPassword = catchAsync(async (req, res, next) => {
  //1. 获取token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  //2. 检查token是否过期
  if (!user) {
    return next(new AppError('重置密码链接已过期', 400));
  }
  //3.更新密码更改时间
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  //4. 让用户进行登录 发送TOKEN
  createSendToken(user, 201, res);
});

// 更新密码
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1. 获取用户
  const user = await User.findById(req.user.id).select('+password');
  // 2. 检查旧密码是否正确
  if (
    req.body.passwordCurrent &&
    !(await user.correctPassword(req.body.passwordCurrent, user.password))
  ) {
    return next(new AppError('旧密码不正确', 401));
  }
  // 3. 更新密码
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // 4. 发送token
  createSendToken(user, 201, res);
});
