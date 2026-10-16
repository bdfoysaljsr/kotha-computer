# Kotha Computer — WhatsApp Order Website

A static, mobile-friendly starter website for Kotha Computer. Customers do not need an account. Order details are formatted in the browser and passed to WhatsApp Click-to-Chat.

## Current behaviour

- No order database and no customer account system.
- No upload endpoint; the website does not upload/store selected photos or PDFs.
- Customer fills the order form and taps the WhatsApp order button.
- WhatsApp opens with a pre-filled message; the customer must press **Send**.
- Includes basic required-field checks, Bangladesh mobile-number format validation, a honeypot field, an in-memory repeat-submission friction check, and a randomly generated reference code.
- Responsive Bengali-first UI, service catalogue, sample product cards, contact information and COD option.

## Important limitations

1. This cannot prove a WhatsApp message was sent or received. Confirm orders manually in WhatsApp.
2. A client-side honeypot and format checks are basic friction, not strong anti-fraud protection. There is no server-side rate limiting, CAPTCHA verification, identity verification or duplicate-order database in this database-free version.
3. A website cannot attach a local photo/PDF automatically through a normal `wa.me` link. Ask customers to attach files themselves inside WhatsApp.
4. No order history is stored by the website. WhatsApp chat history is controlled by WhatsApp and the chat participants.
5. The example products and services need to be updated with actual products, prices, stock, and images before launch.
6. The font is loaded from Google Fonts when internet is available; the website itself is static and can use a fallback font if that request fails.

## Run locally

Open `index.html` in a browser. For a local web server, use any static file server.

## Configure WhatsApp

Edit `WHATSAPP_NUMBER` in `app.js`. Use country code + number without `+`, spaces, or punctuation. The configured value is `8801978551099` (shop number 01978551099).

## Publish free using GitHub + Cloudflare Pages

1. Create a GitHub repository and upload all files in this folder.
2. In Cloudflare, open **Workers & Pages** → **Create** → **Pages** → connect to Git.
3. Select the repository.
4. For a plain static site, leave the build command blank and set the output directory to `/` (or the repository root as accepted by the current dashboard).
5. Deploy and use the assigned `*.pages.dev` address.
6. Open the live site on a phone and test that the form opens WhatsApp and pre-fills the correct information.
7. Before advertising the site, confirm the WhatsApp number, shop address, opening hours, real product list, pricing policy and delivery coverage.

Cloudflare/GitHub interface labels and free-plan terms can change. A custom domain is optional and costs money if you buy one.

## Security and privacy

- Do not add analytics that collect form values.
- Do not place personal customer information in query parameters, logs, or third-party form services.
- Do not add a file upload service unless you also design a deletion policy and access controls.
- If you later require server-side bot protection or order records, a backend will be needed; that may introduce free-plan quotas or maintenance.
