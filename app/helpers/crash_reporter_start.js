module.exports = function () {
  const { crashReporter } = require ('electron');
  crashReporter.start({
    productName: 'Blazing Bookkeeper',
    companyName: 'Blazing Bookkeeper',
    submitURL: 'https://crashreporter.blazingbookkeeper.com',
  });
};
