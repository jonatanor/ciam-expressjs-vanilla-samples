import express from 'express';
import fetch from 'node-fetch';
import { common } from '@ciam-expressjs-vanilla-samples/shared';

const router = express.Router();

/**
 * For more information see https://developer.transmitsecurity.com/guides/user/auth_email_otp
 * **/

// In a production server, you would cache the access token,
// and regenerate whenever it expires.
// This parameter emulates this 'cache' with a static variable for simplicity.
let accessToken = null;
let start_token = null;

// GET login page
router.get('/', function (req, res) {
  res.redirect('/pages/hosted-idv-experience.html');
});

router.post('/start-verification-session', async function (req, res) {
  const state = (Math.floor(Math.random() * (100000 - 1)) + 1).toString();

  // fetch access token
  // For more information see https://developer.transmitsecurity.com/guides/user/retrieve_client_tokens/
  accessToken = await common.tokens.getClientCredsTokenForHostedIDV();

  if (!accessToken) {
    res.status(500).send({ error: 'could not fetch access token' });
  } else {
    // A session is required to provide a secure context for the identity verification flow.
    // Using the access token generated, create a session by sending a backend request
    // For more information see https://developer.transmitsecurity.com/guides/verify/quick_start_web/#step-3-create-session
    const requestBody = JSON.stringify({
      state: state,
      callback_url: process.env.TS_REDIRECT_URI,
      time_to_live: '1h',
    });

    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: requestBody,
      redirect: 'follow',
    };

    fetch(common.config.apis.hostedIDVSessionUrl, requestOptions)
      .then(apiResponse => apiResponse.text())
      .then(apiResponse => {
        console.log(JSON.parse(apiResponse));
        start_token = JSON.parse(apiResponse).start_token;
        res.writeHead(200, { 'Content-Type': 'application/json' });

        // Initiate ID VerificationSession
        // For more information see https://developer.transmitsecurity.com/guides/verify/quick_start_web/#step-4-initiate-id-verification

        res.end(
          JSON.stringify({
            redirectUrl: common.config.apis.hostedIDVVerifyUrl + '/' + start_token,
          }),
        );
      })
      .catch(error => {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Error fetching data: ${error}`);
      });
  }
});

router.get('/complete', async function (req, res) {
  const sessionId = req?.query.sessionId;
  const state = req?.query.state;

  console.log('received body is', sessionId, state);
  // fetch access token
  // For more information see https://developer.transmitsecurity.com/guides/user/retrieve_client_tokens/
  accessToken = await common.tokens.getClientCredsTokenForHostedIDV();

  if (!accessToken) {
    res.status(500).send({ error: 'could not fetch access token' });
  } else {
    const requestOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      redirect: 'follow',
    };

    // Get verification result
    // For more information see https://developer.transmitsecurity.com/guides/verify/quick_start_web/#step-5-get-verification-result

    fetch(`${common.config.apis.hostedIDVSessionUrl}/${sessionId}/result`, requestOptions)
      .then(apiResponse => apiResponse.text())
      .then(apiResponse => {
        console.log(JSON.parse(apiResponse));

        let html = '';

        // Get verification result
        // For more https://developer.transmitsecurity.com/guides/verify/quick_start_web/#step-6-handle-verification-result

        switch (JSON.parse(apiResponse).recommendation) {
          case 'ALLOW':
            html = `
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <link rel="icon" type="image/svg+xml" href="/acme-icon.svg" />
                          <link rel="preconnect" href="https://fonts.googleapis.com" />
                          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
                          <link
                            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap"
                            rel="stylesheet"
                          />
                          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                          <title>ACME</title>
                          <script type="module" src="../pages/init.js"></script>
                        </head>
                        <body>
                          <div class="page">
                            <header>
                              <img src="/acme-logo.svg" />
                            </header>
                            <main>
                              <div class="content column gap">
                                <div id="emailDiv" class="column gap">
                                  <h3>Verification completed with following results:</h3>
                                  <pre>${JSON.stringify(JSON.parse(apiResponse), null, 2)}</pre>
                                </div>
                              </div>
                            </main>
                          </div>
                        </body>
                      </html>
          `;
            break;
          case 'CHALLENGE':
            html = `
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <link rel="icon" type="image/svg+xml" href="/acme-icon.svg" />
                          <link rel="preconnect" href="https://fonts.googleapis.com" />
                          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
                          <link
                            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap"
                            rel="stylesheet"
                          />
                          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                          <title>ACME</title>
                          <script type="module" src="../pages/init.js"></script>
                        </head>
                        <body>
                          <div class="page">
                            <header>
                              <img src="/acme-logo.svg" />
                            </header>
                            <main>
                              <div class="content column gap">
                                <div id="emailDiv" class="column gap">
                                  <h3 style="color: red;">Verification check didn’t pass, initiating a manual review process:</h3>
                                  <pre>${JSON.stringify(JSON.parse(apiResponse), null, 2)}</pre>
                                </div>
                              </div>
                            </main>
                          </div>
                        </body>
                      </html>
          `;
            break;
          case 'DENY':
            html = `
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <link rel="icon" type="image/svg+xml" href="/acme-icon.svg" />
                          <link rel="preconnect" href="https://fonts.googleapis.com" />
                          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
                          <link
                            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap"
                            rel="stylesheet"
                          />
                          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                          <title>ACME</title>
                          <script type="module" src="../pages/init.js"></script>
                        </head>
                        <body>
                          <div class="page">
                            <header>
                              <img src="/acme-logo.svg" />
                            </header>
                            <main>
                              <div class="content column gap">
                                <div id="emailDiv" class="column gap">
                                  <h3 style="color: red;">Verification check didn’t pass, high likelihood of attempted fraud:</h3>
                                  <pre>${JSON.stringify(JSON.parse(apiResponse), null, 2)}</pre>
                                </div>
                              </div>
                            </main>
                          </div>
                        </body>
                      </html>
          `;
            break;
          default:
            break;
        }

        res.send(html);
      })
      .catch(error => {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Error fetching data: ${error}`);
      });
  }
});

export const indexRouter = router;
