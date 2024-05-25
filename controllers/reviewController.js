const factory = require('../controllers/handleFactory');
const Review = require('../models/reviewModel');

//获取评论
exports.getAllReviews = factory.getAll(Review);
exports.setTourUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};
//创建评论
exports.createReview = factory.createOne(Review);
//删除
exports.deleteReview = factory.deleteOne(Review);
//更新
exports.updateReview = factory.updateOne(Review);
//获取单个
exports.getReview = factory.getOne(Review);
