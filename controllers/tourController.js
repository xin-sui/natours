const fs = require('fs');
const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// exports.checkBody = (req, res, next) => {
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({
//       status: 'fail',
//       message: 'Missing name or price'
//     });
//   }
//   next();
// };
exports.aliasTopTours = async (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingAverage,price';
  req.query.fields = 'name,price,ratingAverage,summary,difficulty';
  next();
};

// 导出getAllTours函数，用于获取所有旅游信息
exports.getAllTours = async (req, res) => {
  try {
    // const queryObj = { ...req.query };

    // // 排除非字段 分页 排序 限制 选择
    // const excludedFields = ['page', 'sort', 'limit', 'fields'];
    // excludedFields.forEach(el => delete queryObj[el]);

    // // 将查询参数中的过滤操作符转换为 MongoDB 的操作符
    // let queryStr = JSON.stringify(queryObj);
    // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    // // 创建查询
    // let query = Tour.find(JSON.parse(queryStr));

    // 排序 -price,-ratingAverage -为降序
    // if (req.query.sort) {
    //   const sortBy = req.query.sort.split(',').join(' ');

    //   query = query.sort(sortBy);
    // } else {
    //   query = query.sort('-createdAt')
    // }

    // 字段限制 返回特定字段 -排除字段
    // if (req.query.fields) {
    //   const fields = req.query.fields.split(',').join(' '); // 应该用空格而不是空字符串
    //   query = query.select(fields);
    // } else {
    //   query = query.select('-__v'); // 通常会排除 MongoDB 的 __v 字段
    // }

    //分页 page=2&limit=10
    // const page = req.query.page * 1 || 1
    // const limit = req.query.limit * 1 || 100
    // //计算需要skip跳过多少条数据
    // const skip = (page - 1) * limit
    // query = query.skip(skip).limit(limit)
    // if (req.query.page) {
    //   const numTours = await Tour.countDocuments()
    //   if (skip >= numTours) {
    //     throw new Error('超出总数')
    //   }
    // }
    // 执行查询
    const features = new APIFeatures(Tour.find(), req.query)
      .filter()
      .sort()
      .fields()
      .page();

    const tours = await features.query;

    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        tours
      }
    });
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: '无法获取旅游信息'
    });
  }
};

// 导出getTour函数，用于获取单个旅游信息
exports.getTour = async (req, res) => {
  // console.log(req.params);
  try {
    const tour = await Tour.findById(req.params.id);
    res.status(200).json({
      status: 'success',
      data: {
        tour
      }
    });
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: '查询失败'
    });
  }
};

// 导出createTour函数，用于创建旅游信息
exports.createTour = async (req, res) => {
  console.log(req.body);
  try {
    const newTour = await Tour.create(req.body).then();
    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'faile',
      message: `数据已经存在😅`
    });
  }
};

// 导出updateTour函数，用于更新旅游信息
exports.updateTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      //是否返回新文档
      new: true,
      // 是否在创建文档时运行验证
      runValidators: true
    });
    res.status(200).json({
      status: 'success',
      data: {
        tour: tour
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'faile',
      message: `更新失败`
    });
  }
};

// 导出deleteTour函数，用于删除旅游信息
exports.deleteTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndDelete(req.params.id);
    res.status(204).json({
      status: 'success',
      data: tour
    });
  } catch (error) {
    res.status(400).json({
      status: 'faile',
      message: error
    });
  }
};

exports.getTourStats = async (req, res) => {
  try {
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
  } catch (error) {
    res.status(400).json({
      status: 'faile',
      message: error
    });
  }
};
//统计一年中最热门的一个月
exports.getMonthlyPlan = async (req, res) => {
  try {
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
  } catch (error) {
    res.status(400).json({
      status: 'fail', // 正确的拼写
      message: error
    });
  }
};
