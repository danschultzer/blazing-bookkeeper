module.exports = function (env) {
  if (env.crashSubmitURL) {
    const { crashReporter } = require ('electron');
    crashReporter.start({
      productName: 'Blazing Bookkeeper',
      companyName: 'Blazing Bookkeeper',
      submitURL: env.crashSubmitURL,
      autoSubmit: !!env.autoSubmitCrashReports
    });    
  }
};
