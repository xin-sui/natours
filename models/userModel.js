const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    require: [true, '缺少用户名']
  },
  email: {
    type: String,
    require: [true, '缺少邮箱'],
    unique: true,
    lowercase: true, //转换为大写
    validate: [validator.isEmail, '缺少邮箱']
  },
  photo: String,
  role: {
    type: String,
    //用户 导游 领队 管理员
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    require: [true, '缺少密码'],
    minlength: 8,
    select: false //查询时隐藏密码
    // maxlength: 16
  },
  //二次输入密码
  passwordConfirm: {
    type: String,
    require: [true, '两次密码不一致'],

    validate: {
      // 自定义校验 在创建 保存数据触发
      validator: function(el) {
        return el === this.password;
      }
    }
  },
  passwordChangedAt: Date, //密码更改时间
  passwordResetToken: String, //重置密码token
  passwordResetExpires: Date, //重置密码token过期时间
  active: {
    //用户是否激活
    type: Boolean,
    default: true,
    select: false
  }
});
//用户请求重置密码时
userSchema.pre('save', async function(next) {
  //密码被修改触发 跳过
  if (!this.isModified('password')) {
    return next();
  }
  //对密码进行加密
  this.password = await bcrypt.hash(this.password, 12);
  //清除密码确认
  this.passwordConfirm = undefined;
});
// 更新密码的钩子
userSchema.pre('save', function(next) {
  //如果用户没有更改密码 跳过
  //isModified检查密码  isNew检查是否是新用户
  if (!this.isModified('password') || this.isNew) {
    return next();
  }
  //设置密码更改时间 token发送时间会比更改时间晚
  this.passwordChangedAt = Date.now() - 1000;
  next();
});
//查询时过滤掉不是活跃的用户
userSchema.pre(/^find/, function(next) {
  this.find({ active: { $ne: false } });
  next();
});
// 创建更新密码的钩子
userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  // 使用 bcrypt 的 compare 函数安全地比较候选密码与哈希的用户密码
  return await bcrypt.compare(candidatePassword, userPassword);
};

// JWTTimestamp 给定的 JWT 时间戳
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  // 如果用户的密码曾经被更改过
  if (this.passwordChangedAt) {
    // 将密码更改时间转换为时间戳
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    // 比较 JWT 时间戳和密码更改时间戳，判断是否在给定 JWT 时间戳之后
    return JWTTimestamp < changedTimestamp;
  }
  // 如果密码从未被更改过，则返回 false
  return false;
};

//创建重置密码token
userSchema.methods.createPasswordResetToken = function() {
  // 生成一个随机字符串
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  console.log({ resetToken }, this.passwordResetToken);
  // 设置重置密码token的过期时间
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};
const User = mongoose.model('User', userSchema);
module.exports = User;
