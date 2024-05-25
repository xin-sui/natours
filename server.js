const dotenv = require('dotenv');
const mongoose = require('mongoose');
const app = require('./app');

process.on('uncaughtException', err => {
  console.log('uncaughtException!');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
// const DB = process.env.DATABASE_LOCAL.replace('<PORT>', 1337);
const DB = process.env.DATABASE_LOCAL;
// console.log(DB);
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

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// 监听未处理的 Promise 拒绝事件
process.on('unhandledRejection', err => {
  // 打印错误的名称和消息
  console.log(err.name, err.message);
  server.close(() => {
    // 退出 Node.js 进程，1 表示非正常退出
    process.exit(1);
  });
});
