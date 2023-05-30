# Multi Factor Password authentication and signup

This sample follows parts of the
[official Transmit guide on multi-factor authentication](https://developer.transmitsecurity.com/guides/user/auth_mfa_guide/)

The sample shows how to use the Transmit APIs to create a new user then authenticate them with a
username and password along with a SMS OTP.

Set up this example using the instructions in the [main README file](../README.md)

### Configure password authentication

Configure the passwords authentication method in your tenant by following
[this step in the Transmit guide](https://developer.transmitsecurity.com/guides/user/auth_passwords/#step-3-configure-auth-method).

## Sample user experience

- Open a browser tab on <domain:port>/ - redirects to a user signup page
- Enter your username, password, and phone number and click Create User
  (https://developer.transmitsecurity.com/openapi/user/user/)
- The user will be created and you will be prompted to login
- Enter the username and password on the login page and click Login
  (https://developer.transmitsecurity.com/guides/user/auth_passwords/)
- On the backend MFA authentication will be requested when the username/password authentication
  request is sent
  (https://developer.transmitsecurity.com/guides/user/auth_mfa_guide/#step-1-request-mfa)
- This will cause a redirect to the /complete endpoint with an error indicating MFA is required
  (https://developer.transmitsecurity.com/guides/user/auth_mfa_guide/#step-2-handle-mfa-error)
- An OTP code will be sent to the phone number you signed up with
  (https://developer.transmitsecurity.com/guides/user/auth_sms_otp/)
- Check your phone for the OTP code sent through SMS, enter the code and click the Login button
- The browser will redirect to the completion endpoint and show the OIDC auth code now that the MFA
  flow is complete
- It is recommended to open the browser debugger tools and look at the console logs which reflect
  flow and network. It is also strongly recommended to run this flow in a **new** Private or
  Incognito window **each** time