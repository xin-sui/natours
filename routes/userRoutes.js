const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
//保护以下所有路由
router.use(authController.protect);

//更新密码
router.patch('/updateMyPassword', authController.updatePassword);

//获取用户信息
router.get('/me', userController.getMe, userController.getUser);

//用户更新自己信息
router.patch('/updateMe', userController.updateMe);
//删除用户
router.delete('/deleteMe', userController.deleteMe);
//保护以下所有路由-只有管理员才能访问
router.use(authController.restrictTo('admin'));
router
  .route('/')
  .get(authController.restrictTo('admin'), userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
