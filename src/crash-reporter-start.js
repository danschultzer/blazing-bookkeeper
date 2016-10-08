module.exports = function (extra) {
  import crashReporter from 'electron';
  crashReporter.start({
    productName: 'Blazing Bookkeeper',
    companyName: 'Blazing Bookkeeper',
    submitURL: 'https://crashreporter.blazingbookkeeper.com',
    autoSubmit: false,
    extra: extra
  });
};
