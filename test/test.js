const puppeteer = require('puppeteer');
const { expect } = require('chai');
const browserSync = require('browser-sync').create();

let browser = null;
let page = null;

before(async function() {
  // Set a higher timeout to allow puppeteer and browserSync time to start
  this.timeout(5000);

  // Workaround until https://github.com/GoogleChrome/puppeteer/issues/290 is fixed
  browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });

  page = await browser.newPage();

  await page.setViewport({
    width: 1024,
    height: 768
  });

  await new Promise(resolve =>
    browserSync.init(
      {
        port: 5000,
        notify: false,
        open: false,
        ui: false,
        logLevel: 'silent',
        server: {
          baseDir: ['examples', '.', 'node_modules']
        }
      },
      resolve
    )
  );
});

after(async () => {
  await browser.close();
  browserSync.exit();
});

describe('html-lite', () => {
  describe('some test', () => {
    beforeEach(async () => {
      await page.goto('http://localhost:5000/test/some-test.html');
    });

    it('should do a thing in a browser', async () => {
      const two = await page.evaluate(() => {
        return 1 + 1;
      });
      expect(two).to.be.equal(2);
    });
  });
});
