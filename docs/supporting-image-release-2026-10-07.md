# Supporting images and completion blueprint

The venue now has four additional reference-based restorations: the exterior,
entrance courtyard, bar screen and night turf. The original photographs remain
in the archive. Versioned masters, exact prompts, edit limits and crop metadata
are committed with the website; 60 AVIF/JPEG variants serve the appropriate
sizes without enlarging the source beyond its native width.

The homepage adds a building feature, expands the gallery to eleven photographs
and provides five practical visit answers. Prices and the call-to-reserve
behaviour still come from the existing catalogue and brochure configuration.
The site's typography, motion controls, preloader and favicon remain integrated.

Generated restoration may reconstruct fine detail. The bar image is evidence
of the actual screen and layout, not an exact broadcast score, advertised fixture
or beverage label. The sauna macro remains visibly illustrative. Real sauna
interiors, bedrooms/bathrooms, menu dishes and kids sessions remain photographic
coverage gaps; the plan includes source requirements and conditional prompts.

## Verification

- All 27 engine tests passed.
- Browser checks passed for the homepage at 320, 390, 768 and 1440 pixels, and for
  the booking hub and six amenity pages at 390 and 1440 pixels.
- Gallery navigation, native dialog keyboard controls, focus restoration,
  reduced motion and visit answers passed, with no page errors or overflow.
- All 60 new responsive image files decoded, retained the expected dimensions
  and contained no EXIF metadata.
- The PDF has 128 pages and 128 bookmarks. Text and page-fit checks found no
  out-of-bounds content. The rendered pages receive visual review before delivery.

## Remaining completion work

[The full blueprint](Social_Spot_Completion_Plan.md) documents the product,
software engineering, image production, security, testing and operational gates.
It records concrete risks in the current server source, including per-document
SQLite writes, late-payment capacity enforcement and staff-session revocation.
Those are proposed future fixes rather than claims about this visual release.

The current public deployment has no API configured. Durable online bookings
and payments require the backend and operating gates in the blueprint before
activation.
