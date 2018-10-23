Local-ESI
=========

[![Build Status](https://travis-ci.org/ExpressenAB/local-esi.svg?branch=master)](https://travis-ci.org/ExpressenAB/local-esi)[![dependencies Status](https://david-dm.org/ExpressenAB/local-esi/status.svg)](https://david-dm.org/ExpressenAB/local-esi)

Make your Express app work like it had Akamai Edge Side Includes parsing.

# Example Express route:

```javascript
"use strict";

const localEsi = require("@expressen/local-esi");

module.exports = (req, res, next) => {
  res.render("index", { data: "a" }, (err, html) => {
    if (err) return next(err);

    localEsi(html, req, (esiErr, esializedHtml) => {
      if (esiErr) return next(esiErr);
      res.send(esializedHtml);
    });
  });
};
```
