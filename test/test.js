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
          baseDir: ['.', 'node_modules']
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

describe('markers', () => {
  const alphaNumericalRegex = /^[a-z0-9]+$/;
  const alphaNumericalAndDashRegex = /^[a-z0-9\-]+$/;
  beforeEach(async () => {
    await page.goto('http://localhost:5000/test/marker.html');
  });

  describe('marker', () => {
    it('should contain only lowercase alphanumerical characters', async () => {
      const marker = await page.evaluate(() => {
        return window.markers.marker;
      });
      expect(marker.match(alphaNumericalRegex)).to.not.be.null;
    });
    it('should be at least 8 characters long', async () => {
      const marker = await page.evaluate(() => {
        return window.markers.marker;
      });
      expect(marker.length >= 8).to.be.true;
    });
  });

  describe('nodeMarker', () => {
    it(`should start with 'node-'`, async () => {
      const nodeMarker = await page.evaluate(() => {
        return markers.nodeMarker;
      });
      expect(nodeMarker.substring(0, 5)).to.be.equal('node-');
    });
    it(`should only contain lowercase alphanumerical characters and '-'`, async () => {
      const nodeMarker = await page.evaluate(() => {
        return markers.commentMarker;
      });
      expect(nodeMarker.match(alphaNumericalAndDashRegex)).to.not.be.null;
    });
  });

  describe('commentMarker', () => {
    it(`should start with 'comment-'`, async () => {
      const commentMarker = await page.evaluate(() => {
        return markers.commentMarker;
      });
      expect(commentMarker.substring(0, 8)).to.be.equal('comment-');
    });
    it(`should only contain lowercase alphanumerical characters and '-'`, async () => {
      const commentMarker = await page.evaluate(() => {
        return markers.commentMarker;
      });
      expect(commentMarker.match(alphaNumericalAndDashRegex)).to.not.be.null;
    });
  });

  describe('attributeMarker', () => {
    it(`should start with 'attribute-'`, async () => {
      const attributeMarker = await page.evaluate(() => {
        return markers.attributeMarker;
      });
      expect(attributeMarker.substring(0, 10)).to.be.equal('attribute-');
    });
    it(`should only contain lowercase alphanumerical characters and '-'`, async () => {
      const attributeMarker = await page.evaluate(() => {
        return markers.attributeMarker;
      });
      expect(attributeMarker.match(alphaNumericalAndDashRegex)).to.not.be.null;
    });
  });
});

describe('template-parser', () => {
  beforeEach(async () => {
    await page.goto('http://localhost:5000/test/template-parser.html');
  });

  describe('htmlContext', () => {
    it(`detects open comments`, async () => {
      const commentContext = await page.evaluate(() => {
        return TemplateParser.htmlContext('<!--').type === TemplateParser.commentContext;
      });
      expect(commentContext).to.be.true;
    });

    it(`detects closed comments`, async () => {
      const commentClosed = await page.evaluate(() => {
        return TemplateParser.htmlContext('<!-- -->').commentClosed;
      });
      expect(commentClosed).to.be.true;
    });

    it(`detects shorthand closed comments`, async () => {
      const commentClosed = await page.evaluate(() => {
        return TemplateParser.htmlContext('<!-->').commentClosed;
      });
      expect(commentClosed).to.be.true;
    });
  });
});
