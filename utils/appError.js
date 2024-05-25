// 定义一个继承自 Error 的 AppError 类
class AppError extends Error {
  // 构造函数，接收 message 和 statusCode 作为参数
  constructor(message, statusCode) {
    // 调用父类的构造函数，传入 message 参数
    super(message);
    // 设置这个对象的 statusCode 属性，值为传入的 statusCode 参数
    this.statusCode = statusCode;
    // 设置这个对象的 status 属性，如果 statusCode 以 4 开头，则为 fail，否则为 error
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    // 设置这个对象的 isOperational 属性，值为 true，用于表示这个错误是否是可操作的
    this.isOperational = true;
    // 调用 Error 类的 captureStackTrace 方法，将这个对象的信息记录到栈跟踪中
    Error.captureStackTrace(this, this.constructor);
  }
}

// 导出 AppError 类
module.exports = AppError;
