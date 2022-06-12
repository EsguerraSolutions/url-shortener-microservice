require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

const urlsDB = require('./shortened-url.model');
const { mongoConnect } = require('./mongo');


// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// app.use(express.json());
app.use(express.urlencoded());

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

//Posting new short url endpoints
const defaultUrlID = 0;

async function getLatestShortUrl() {
  const latestUrl = await urlsDB.findOne()
      .sort('-short_url');

  if (!latestUrl) {
      return defaultUrlID;
  }

  return latestUrl.short_url;
}

async function addNewUrl(urlReqObj) {
  const url = await urlsDB.findOne({
    original_url : urlReqObj.original_url
  });

  if (!url) {
    const newShortUrl = await getLatestShortUrl() + 1;
    const newUrl = Object.assign(urlReqObj, {
      short_url : newShortUrl
    });
    await urlsDB.updateOne({
      short_url : newShortUrl
    }, newUrl, {
      upsert : true
    });
    return newShortUrl;
  }

  else {
    return url.short_url;
  }
}

function isValidHttpUrl(string) {
  let url;
  
  try {
    url = new URL(string);
  } catch (_) {
    return false;  
  }

  return url.protocol === "http:" || url.protocol === "https:";
}

app.post('/api/shorturl', async (req,res) => {
  console.log(req.body);

  if(isValidHttpUrl(req.body.url)) {
    const urlReqObj = {
      original_url : req.body.url
    };
    const short_url = await addNewUrl(urlReqObj);
    return res.json({
      original_url: urlReqObj.original_url,
      short_url
    });
  }

  else {
    return res.json({ error: 'invalid url' });
  }
});

//Getting new short url endpoints
app.get('/api/shorturl/:shorturl', async (req, res) => {
  const url = await urlsDB.findOne({
    short_url : req.params.shorturl
  }); 
  res.redirect(url.original_url);
});

//Starting Server
async function startServer() {
  await mongoConnect();
  app.listen(port, function() {
    console.log(`Listening on port ${port}`);
  });
}

startServer();
