// Release 1 功能配置
const releaseConfig = {
  version: '1.0',
  features: {
    // Release 1 功能
    login: true,
    logout: true,
    register: true,
    browseBooks: true,
    searchBooks: true,
    lockBook: true,
    borrowBook: true,
    returnRequest: true,
    borrowHistory: true,
    addBook: true,
    handleReturnRequests: true,
    viewAllBooks: true,
    createAccount: true,
    manageUsers: true,
    
    // Release 2 功能
    passwordReset: false,
    renewBook: false,
    reserveBook: false,
    editBook: false,
    deleteBook: false,
    manageCategories: false,
    blockUser: false,
    unblockUser: false,
    systemSettings: false,
    announcementManagement: false,
    
    // Release 3 功能
    editProfile: false,
    browseByCategory: false,
    popularBooks: false,
    borrowingStats: false,
    toggleFeatures: false,
    viewSystemLogs: false
  }
};

module.exports = releaseConfig;