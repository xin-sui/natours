const dotenv = require('dotenv');
const mongoose = require('mongoose');
const app = require('./app');

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
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
