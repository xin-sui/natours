//评论 评价 创造时间 属于哪个景点 谁的评论
const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, '评论不能为空']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, '评论必须属于一个旅游路线']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, '评论必须属于一个用户']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// 避免重复评论将评论和用户关联起来
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

//查询时补充数据
reviewSchema.pre(/^find/, function(next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name'
  // }).populate({
  //   path: 'user',
  //   select: 'name photo'
  // });
  this.populate({
    path: 'user',
    select: 'name photo'
  });
  next();
});

reviewSchema.statics.calcAverageRatings = async function(tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 }, //评价人数
        avgRating: { $avg: '$rating' } //平均评价
      }
    }
  ]);
  console.log(stats);
  //当前评论数量大于0时更新tour的评论数量和平均值
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
    //当前评论数量等于0时更新tour的评论数量和平均值
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
};

// 保存评论后更新tour的评论数量和平均值
reviewSchema.post('save', function() {
  // this.constructor 指向当前的model
  this.constructor.calcAverageRatings(this.tour);
});

//删除评论时更新tour的评论数量和平均值 保存当前旅游id
reviewSchema.pre(/^findOneAnd/, async function(next) {
  this.review = await this.findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function(doc, next) {
  // 更新tour的评论数量和平均值
  if (this.review) {
    // 检查 this.review 是否为空
    await this.review.constructor.calcAverageRatings(this.review.tour);
  }
  next(); // 调用 next 函数
});

module.exports = mongoose.model('Review', reviewSchema);
