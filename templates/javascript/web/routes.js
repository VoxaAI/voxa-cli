const express = require("express");

const router = express.Router();

router.get("/account-linking", (req, res) => {
  const params = {
    redirect_uri: req.query.redirect_uri,
    state: req.query.state,
  };

  res.render('main', params);
});
router.post("/account-linking", (req, res) => {
  const { email, password, redirect_uri, state } = req.body;
  const accessToken = 'YourGeneratedRandomTokenForTheUser';
  const redirectUrl = `${redirect_uri}#state=${state}&access_token=${accessToken}&token_type=Bearer`;
  res.redirect(redirectUrl);
});

module.exports = router;
