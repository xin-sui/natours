const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
  // 名称
  name: {
    // 类型为字符串
    type: String,
    // 必须有一个name
    require: [true, '必须有一个name'],
    // 唯一性
    unique: true,
    trim: true //去除空格
  },
  //持续时间
  duration: {
    // 类型为数字
    type: Number,
    require: [true, '必须有个持续时间']
  },
  //最多参与人数
  maxGroupSize: {
    type: Number,
    require: [true, '参与最大人数']
  },
  //困难程度
  difficulty: {
    type: String,
    require: [true, '困难程度']
  },
  // 评分
  ratingAverage: {
    // 类型为数字
    type: Number,
    // 默认值为4.5
    default: 4.5
  },
  //评价数量
  ratingsQuantity: {
    type: Number,
    default: 0
  },
  // 价格
  price: {
    // 类型为数字
    type: Number,
    // 必须有一个价格
    require: [true, '必须有一个价格']
  },
  //折扣
  priceDiscount: Number,
  //文章描述
  summary: {
    type: String,
    trim: true, //去除空格
    require: [true, '必须有一个描述']
  },
  //总结
  description: {
    type: String,
    trim: true
  },
  //主图
  imageCover: {
    type: String,
    require: [true, '必须有个封面图']
  },
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false //不会查询出来
  },
  startDates: [Date]
});
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
