class APIFeatures {
  // 構造函數接收兩個參數：一個 MongoDB 查詢對象和一個查詢參數對象
  constructor(query, queryBody) {
    this.query = query; // MongoDB 查詢對象
    this.queryBody = queryBody; // 從 Express 請求中獲取的查詢參數
  }

  // 過濾方法，用於根據查詢參數對象過濾數據
  filter() {
    const queryObj = { ...this.queryBody };

    // 定義一個數組，包含不應該用於過濾的查詢參數字段
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]); // 從查詢對象中刪除這些字段

    // 將查詢參數中的過濾操作符轉換為 MongoDB 的操作符
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    this.query.find(JSON.parse(queryStr)); // 應用過濾條件到 MongoDB 查詢對象
    return this; // 返回 APIFeatures 實例以支持鏈式調用
  }

  // 排序方法，用於根據查詢參數對象中的 sort 字段對結果進行排序
  sort() {
    if (this.queryBody.sort) {
      const sortBy = this.queryBody.sort.split(',').join(' '); // 將逗號分隔的字符串轉換為空格分隔
      this.query = this.query.sort(sortBy); // 應用排序條件
    } else {
      this.query = this.query.sort('-createdAt'); // 默認按創建時間降序排序
    }
    return this; // 返回 APIFeatures 實例以支持鏈式調用
  }

  // 字段選擇方法，用於限制查詢結果中應該返回哪些字段
  fields() {
    if (this.queryBody.fields) {
      const fields = this.queryBody.fields.split(',').join(' '); // 將逗號分隔的字符串轉換為空格分隔
      this.query = this.query.select(fields); // 應用字段選擇條件
    } else {
      this.query = this.query.select('-__v'); // 默認排除 MongoDB 的 __v 字段
    }
    return this; // 返回 APIFeatures 實例以支持鏈式調用
  }

  // 分頁方法，用於實現查詢結果的分頁
  page() {
    const page = this.queryBody.page * 1 || 1; // 計算當前頁碼，默認為第 1 頁
    const limit = this.queryBody.limit * 1 || 100; // 計算每頁限制的文檔數量，默認為 100
    const skip = (page - 1) * limit; // 計算需要跳過的文檔數量
    this.query = this.query.skip(skip).limit(limit); // 應用分頁條件

    return this; // 返回 APIFeatures 實例以支持鏈式調用
  }
}
module.exports = APIFeatures;
