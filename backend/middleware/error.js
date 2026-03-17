// 统一错误处理中间件
exports.errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  console.error('Stack:', err.stack);
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
};