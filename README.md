# Sujok Homeo Clinic — Homepage

Static homepage built from the *Frame 2* design using HTML5, CSS3 and vanilla JavaScript. It has no dependencies and no build step.

## Files

```
index.html          Page markup (semantic sections + inline SVG icon sprite)
style.css           All styles: design tokens in :root, then sections, then responsive rules
script.js           Mobile menu, Shop Online dropdown, header shadow, active nav link, booking form
serve.ps1           Optional tiny local web server (Windows PowerShell)
assets/images/      Logo (transparent PNG) and photos taken from the design PDF
```

## Run locally

Opening `index.html` directly in a browser works. To serve it over `http://` like a real site, use one of these options:

- **Windows (no install):** `powershell -ExecutionPolicy Bypass -File serve.ps1`, then open http://localhost:8080
- **VS Code:** use the *Live Server* extension and choose "Open with Live Server".
- **Python (if installed):** `python -m http.server 8080`
- **Node (if installed):** `npx serve .`

## Booking form

The form validates input, but it is **not connected to a booking service**. When someone submits it, the page tells them the request was not sent and gives the clinic's phone number and email instead.

To connect the form, set `data-endpoint` on `<form id="booking-form">` to a form-service or API URL (for example Formspree). `script.js` will then POST the fields to that URL and show a confirmation.

## Before going live

- Replace the placeholder `href="#"` links (E-Store, Order Online, Re-order Form, Login, Cart, social profiles, FAQ, Talk Shows, Materia Medica, Terms, Privacy) with the real URLs. Each one is marked with a `TODO` comment.
- Check the copy taken from the design with the clinic, especially "25+ Years of Experience", "scientifically based system" and the insurance coverage statement.
- The photos were cut from the design mockup at roughly 1x resolution. For sharper results on high-DPI screens, replace them with the original high-resolution photos, using the same filenames.
