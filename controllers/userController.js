const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('../controllers/handleFactory');

// 过滤对象函数，obj为传入的对象，alloweFields为允许的字段
const filterObj = (obj, ...alloweFields) => {
  // 创建一个新的对象
  const newObj = {};
  // 遍历对象的每一个键
  Object.keys(obj).forEach(el => {
    // 如果允许的字段中包含当前键，则将该键的值赋值给新对象
    if (alloweFields.includes(el)) newObj[el] = obj[el];
  });
  // 返回新对象
  return newObj;
};

// 获取所有用户
exports.getAllUsers = factory.getAll(User);

// 获取单个用户
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
//用户更新自己的信息
exports.updateMe = catchAsync(async (req, res, next) => {
  //1.  如果创建者尝试更新密码，则拒绝
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('这条线路不能更新密码', 400));
  }
  //2. 如果没有则更新用户信息
  const filteredBody = filterObj(req.body, ['name', 'email']);
  const updateUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      filteredBody
    },
    { new: true, runValidators: true } //runValidators: true 选项允许在更新文档时执行模型中定义的验证器
  );

  //3. 返回更新后的用户信息
  res.status(200).json({
    status: 'success',
    data: {
      user: updateUser
    }
  });
});

// 删除用户
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null
  });
});
// 根据ID获取用户
exports.getUser = factory.getOne(User);
// 创建用户
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
// 更新用户
exports.updateUser = factory.updateOne(User);
// 删除用户
exports.deleteUser = factory.deleteOne(User);
