# Backend on Render: email setup

Render auto-deploys the backend from GitHub (`main`). Settings live in the Render dashboard
(service > Environment); they are not in git.

## Why email needs a provider other than Gmail
Render's free plan blocks outbound traffic on ports 25, 465 and 587 (see render.com/docs/free).
Gmail's mail server only works on 587 or 465, so every email from the live backend fails: password
reset codes, fresher verification codes, receipts, the admin email manager and HOC announcements.
Use a provider that also listens on port 2525 (Brevo, SendGrid, Mailgun). Brevo is free for 300 emails a day.

## Brevo setup (about 10 minutes)
1. Create an account at brevo.com and confirm your email.
2. Senders, domains and IPs > Senders > Add a sender (name "NACOS LASUSTECH", an address you control).
   Open the confirmation email Brevo sends to that address.
   Better for deliverability: authenticate your own domain (add the DNS records Brevo shows for
   nacoslasustech.org.ng) and send from something like noreply@nacoslasustech.org.ng.
3. SMTP and API > SMTP tab: note the SMTP server (`smtp-relay.brevo.com`) and your login, then click
   "Generate a new SMTP key" and copy it (it is shown once).
4. In the Render dashboard, set these (replacing the old Gmail values), then save:

   | Setting | Value |
   |---|---|
   | `SMTP_HOST` | `smtp-relay.brevo.com` |
   | `SMTP_PORT` | `2525` |
   | `SMTP_USER` | your Brevo SMTP login |
   | `SMTP_PASS` | the SMTP key from step 3 |
   | `MAIL_FROM` | the sender address you verified in step 2 |

   `MAIL_FROM` is the address people see. It must be a verified sender, which is why it is separate from
   `SMTP_USER` (Brevo's login is not an email address you can send from).
5. Render redeploys. Then sign in to the admin > Email > "Test email connection". It should say
   "Email is working". If it does not, the message says whether the port is blocked, the login was
   rejected, or the sender is not verified.

## Local development
Gmail still works on your own computer (port 587 is not blocked there). Keep `SMTP_HOST=smtp.gmail.com`,
`SMTP_PORT=587` and your Gmail app password in `backend/.env`. `MAIL_FROM` is optional there.
