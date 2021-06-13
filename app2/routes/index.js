var express = require('express');
var router = express.Router();

class OGP {
  url = ""
  siteName = ""
  title = ""
  description = ""
  type = ""
  image = ""
  sharedTimes = 0
  constructor(url = "", siteName = "", title = "", description = "", type = "", image = "", sharedTimes = 0) {
    this.url = url;
    this.siteName = siteName;
    this.title = title;
    this.description = description;
    this.type = type;
    this.image = image;
    this.sharedTimes = sharedTimes;
  }
  toJSON() {
    return {
      url: this.url,
      siteName: this.siteName,
      title: this.title,
      description: this.description,
      type: this.type,
      image: this.image,
      sharedTimes: this.sharedTimes,
    }
  }
};

/* GET home page. */
router.get('/', function (req, res, next) {
  const ogp = new OGP(
    url = "https://speakerdeck.com/twada/quality-and-speed-2020-autumn-edition",
    siteName = "Speaker Deck",
    title = "質とスピード（2020秋100分拡大版） / Quality and Speed 2020 Autumn Edition",
    description = "質とスピード（2020秋100分拡大版）2020/11/20 @ JaSST'20 Kyushu",
    type = "website",
    image = "https://files.speakerdeck.com/presentations/9ca54caac3db4344bdd140015dc5e081/slide_0.jpg?16782471",
    sharedTimes = 10
  );
  const ogpList = [];
  for (var i = 0; i < 10; i++) {
    ogpList.push(ogp.toJSON());
  }
  res.render('index', { title: 'Hot Tech Slide', ogpList: ogpList });
});

module.exports = router;
