// const validator = require('validator');

const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');

const tourSchema = new mongoose.Schema(
  {
    // 名称
    name: {
      // 类型为字符串
      type: String,
      // 必须有一个name
      require: [true, '必须有一个name'],
      // 唯一性
      unique: true,
      trim: true, //去除空格
      //校验
      maxlength: [40, '40个字以内'],
      minLength: [5, '至少5个字符']
      // validate: [validator.isAlpha, '名字必须是字符串'] 使用外部库
    },
    slug: String,
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
      require: [true, '困难程度'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: '必须在 easy,medium,difficult 其中一个'
      }
    },
    // 评分
    ratingsAverage: {
      // 类型为数字
      type: Number,
      // 默认值为4.5
      default: 4.5,
      min: [1, '评价必须高于1'],
      max: [5, '评价必须低于5'],
      set: val => Math.round(val * 10) / 10 //四舍五入
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
    priceDiscount: {
      type: Number,
      //自定义校验
      validate: {
        validator: function(val) {
          return val < this.price;
        },
        message: '折扣不能低于{VALUE}原价'
      }
    },
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
    startDates: [Date],
    secreTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      // 地理位置
      type: {
        type: String,
        default: 'Point', // 默认值为Point
        enum: ['Point'] // 指定类型为Point
      },
      // 经纬度
      coordinates: [Number],
      // 地点名称
      address: String,
      // 地点详情
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point', // 默认值为Point
          enum: ['Point'] // 指定类型为Point
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });
// chema 可以定義虛擬屬性（virtuals），這些虛擬屬性不會被實際保存到 MongoDB 數據庫中，但它們可以在查詢文檔時被當作文檔的屬性來使用。
tourSchema.virtual('durationWeeks').get(function() {
  // 计算tour的持续时间，以周为单位
  return (this.duration / 7).toFixed(2);
});

// 添加虚拟属性 reviews
tourSchema.virtual('reviews', {
  ref: 'Review', // 指定关联的模型
  foreignField: 'tour', // 关联字段
  localField: '_id' // 当前文档的ID字段
});

//文档中间件 当保存，创建文档之前
tourSchema.pre('save', function(next) {
  //this 指向当前处理的文档
  // slugify 是一个函数，用于将给定的字符串转换为 URL 友好的格式。这个函数通常会移除特殊字符、空格，并且将所有字符转换为小写。
  this.slug = slugify(this.name, { lower: true });
  next();
});

//嵌入式文档，在创建新文档时，将当前文档的创建者添加到文档中。
// tourSchema.pre('save', async function(next) {
//   //this 指向当前处理的文档
//   const guidesPromises = this.guides.map(async id => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
// });

////文档中间件 当保存，创建文档之之后
// tourSchema.post('save', function(doc, next) {
//   next();
// });

//查询中间件之前 //正则匹配所有find 如findOne findById
tourSchema.pre('/^find/', function(next) {
  //THIS 指向查询
  this.find({
    secreTour: {
      $ne: true
    }
  }); //指定字段不等于secreTour true的值
  next();
});

//查询时补充数据
tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });
  next();
});

//查询中间件之后 返回的文件 //正则匹配所有find 如findOne findById
tourSchema.pre('/^find/', function(docs, next) {
  //THIS 指向查询
  console.log(docs);
  next();
});
// 聚合中间件，在执行聚合查询之前添加 $match 阶段
tourSchema.pre('aggregate', function(next) {
  // 将 $match 阶段添加到聚合管道的开头，排除 secreTour 为 true 的文档
  this.pipeline().unshift({
    $match: { secretTour: { $ne: true } }
  });
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
