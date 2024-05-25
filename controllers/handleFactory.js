const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new AppError('没有找该id', 404));
    }
    res.status(204).json({
      status: 'success',
      data: null
    });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      //是否返回新文档
      new: true,
      // 是否在创建文档时运行验证
      runValidators: true
    });
    //如果没有找到
    if (!doc) {
      return next(new AppError('没有找该id', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;
    if (!doc) {
      return next(new AppError('没有找该id', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.getAll = Model =>
  catchAsync(async (req, res) => {
    //嵌套 查询
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    // // 排除非字段 分页 排序 限制 选择
    // const excludedFields = ['page', 'sort', 'limit', 'fields'];
    // 执行查询
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .fields()
      .page();
    //  const doc = await features.query.explain()
    const doc = await features.query;

    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        data: doc
      }
    });
  });
