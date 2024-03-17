const express = require('express');
const tourController = require('../controllers/tourController');

const router = express.Router();

// router.param('id', tourController.checkID);
//前五名最便宜 aliasTopTours中间件 预设参数
router.route('/top-5-cheap').get(tourController.aliasTopTours, tourController.getAllTours)
//计算出评分>=4.5 price` 字段的平均值 price` 字段的平均值 price` 字段的平均值
router.route('/tours-stats').get(tourController.getTourStats)
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan)
router
  .route('/')
  .get(tourController.getAllTours)
  .post(tourController.createTour);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;
