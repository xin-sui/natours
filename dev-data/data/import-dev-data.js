const dotenv = require('dotenv');
const mongoose = require('mongoose');
const fs = require('fs');
//模型
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');

dotenv.config({ path: './config.env' });
const DB = process.env.DATABASE_LOCAL;

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
    // useUnifiedTopology: true
  })
  .then(con => {
    // console.log(con.connections);
    console.log('MongoDb success');
  })
  .catch(err => {
    console.log(err);
  });
//读取json
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8')
// );
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);
//导入数据库

const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('导入成功');
    process.exit();
  } catch (error) {
    console.log(error);
  }
};

// 删除所有数据
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('删除成功');
    process.exit();
  } catch (error) {
    console.log(error);
  }
};
if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
// 进程
console.log(process.argv);
// node .\dev-data\data\import-dev-data.js --delete
// node .\dev-data\data\import-dev-data.js --import
