const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('../routes/reviewRoutes');

const router = express.Router();
//嵌套路由
router.use('/:tourId/reviews', reviewRouter);

//前五名最便宜 aliasTopTours中间件 预设参数
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);
//计算出评分>=4.5 price` 字段的平均值 price` 字段的平均值 price` 字段的平均值
router.route('/tours-stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );
//分别是距离 中心点 经度 纬度 单位
// /tours-within?distance=233&center=-40,45&unit=mi
//这种 /tours-within/233/center/-40,45/unit/mi
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

//获取指定范围内的数据
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);
router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
