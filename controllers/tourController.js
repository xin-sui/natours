const fs = require('fs');
const Tour = require('../models/tourModel');

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

// 导出getAllTours函数，用于获取所有旅游信息
exports.getAllTours = async (req, res) => {
  try {
    const queryObj = { ...req.query };

    // 排除非字段 分页 排序 限制 选择
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    // 将查询参数中的过滤操作符转换为 MongoDB 的操作符
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    // 创建查询
    let query = Tour.find(JSON.parse(queryStr));

    // 排序 -price,-ratingAverage -为降序 
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');

      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt')
    }

    // 字段限制 返回特定字段 -排除字段
    if (req.query.fields) {
      const fields = req.query.fields.split(',').join(' '); // 应该用空格而不是空字符串
      query = query.select(fields);
    } else {
      query = query.select('-__v'); // 通常会排除 MongoDB 的 __v 字段
    }

    // 执行查询
    const tours = await query;

    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        tours
      }
    });
  } catch (error) {
    console.error(error); // 服务器端记录错误
    res.status(404).json({
      status: 'fail',
      message: '无法获取旅游信息'
    });
  }
};


// 导出getTour函数，用于获取单个旅游信息
exports.getTour = async (req, res) => {
  console.log(req.params);
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
