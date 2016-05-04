# control

Usage:

1. `git clone` this repo.
2. `cd control`
3. `npm install`
4. modify these files:
  + config/config.js  ->  fb_root_userid
  + config/fb.js      ->  api_key & api_secret
  and perhaps,
  + config/db.js      ->  url ( mongodb url & port )
5. set env variables
  + `export TB_KEY=[ your key ]`
  + `export TB_SECRET=[ your secret ]`

  
**Please make sure `mongo` is running**
