/* Social Spot website settings.

   api: the address of the Social Spot server (it sells the tickets, takes the
   bookings and runs the staff area).

   - Leave it empty when this folder is served by the Social Spot server itself
     (Render, a VPS or Docker). That's the normal setup.
   - If these website files are hosted on GitHub Pages or Netlify instead, put
     the server's address here, for example:
       api: 'https://social-spot.onrender.com'
     Without a server the site still shows everything, with a "call us to book"
     notice. */
window.SOCIAL_SPOT = {
  api: '',
};
