// const fs = require('fs');
const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('../controllers/handleFactory');
const AppError = require('../utils/appError');
// 导出aliasTopTours函数，用于获取前五个评分最高的旅游信息
exports.aliasTopTours = async (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingAverage,price';
  req.query.fields = 'name,price,ratingAverage,summary,difficulty';
  next();
};

// 导出getAllTours函数，用于获取所有旅游信息
exports.getAllTours = factory.getAll(Tour);
// 导出getTour函数，用于获取单个旅游信息
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
// 导出createTour函数，用于创建旅游信息
exports.createTour = factory.createOne(Tour);
// 导出updateTour函数，用于更新旅游信息
exports.updateTour = factory.updateOne(Tour);
// 导出deleteTour函数，用于删除旅游信息
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res) => {
  const stats = await Tour.aggregate([
    {
      $match: {
        ratingAverage: { $gte: 4.5 }
      }
    },
    {
      $group: {
        _id: '$difficulty',
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' }, //评论总数
        avgRating: { $avg: '$ratingAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { avgPrice: 1 }
    }
    // {
    //   $match: { _id: { $ne: 'easy' } }
    // }
  ]);
  res.status(200).json({
    status: 'success',
    data: stats
  });
});
//统计一年中最热门的一个月
exports.getMonthlyPlan = catchAsync(async (req, res) => {
  console.log(req.params.year);
  const year = req.params.year * 1; // 确保年份是数字类型
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates' // 正确使用 $unwind 阶段
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numToursStarts: { $sum: 1 },
        tours: {
          $push: '$name'
        }
      }
    },
    {
      $addFields: {
        month: '$_id'
      }
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: {
        numToursStarts: 1
      }
    }
    // 你可以在这里继续添加其他聚合阶段，如 $group 等
  ]);
  res.status(200).json({
    status: 'success',
    data: plan
  });
});
// 获取旅游信息中指定范围内的旅游信息
// /tours-distance/233,321/center/40,-75/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  console.log('distance', distance, 'lat', lat, 'lng', lng, 'unit', unit);
  if (!lat || !lng) {
    next(new AppError('请提供正确的经纬度', 400));
  }
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  const tours = await Tour.find({
    //startLocation 是数据库中的字段，用于存储旅游信息的起始地点位置。
    startLocation: {
      $geoWithin: {
        //$geoWithin 是 MongoDB 的地理空间查询操作符，用于查找在指定地理区域内的文档。
        // $centerSphere 是 $geoWithin 操作符的一个选项，它指定了一个圆心和半径的圆形区域，在该区域内进行搜索。
        $centerSphere: [[lng, lat], radius]
      }
    }
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  });
});
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  if (!lat || !lng) {
    next(new AppError('请提供正确的经纬度', 400));
  }

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001; //如果是英里，则乘数为0.000621371，如果是公里，则乘数为0.001

  const distances = await Tour.aggregate([
    {
      //  $geoNear 阶段用于计算两个地理空间对象之间的距离。
      $geoNear: {
        near: {
          type: 'Point', // 指定要查找的地理空间类型为点
          coordinates: [lng * 1, lat * 1] // 指定点的坐标
        },
        distanceField: 'distance', // 距离字段
        distanceMultiplier: multiplier // 距离乘数
      }
    },
    {
      // 投影操作符，用于选择要返回的字段
      $project: {
        distance: 1, //距离
        name: 1 //旅游名称
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  });
});
