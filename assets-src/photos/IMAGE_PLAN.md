# Amenity photography update

The original venue photos are the source of truth. Keep fixed architecture,
room size, equipment, materials, furniture, landscaping and camera position.
Restore exposure and phone noise with a smooth finish. Avoid invented rooms,
fake luxury finishes, enlarged facilities and sharpening halos.

| Space | Source | Website treatment |
| --- | --- | --- |
| Gym | IMG_2410 and recovered IMG_2411 | Reference-guided restoration, empty-room cleanup; consistent card, banner and portrait crops |
| Football turf / kids soccer | IMG_0904 | Restore only a locked crop of the real pitch; retain enclosure, goals, planting and scale |
| Penthouse | Recovered IMG_2419 | Restore real dining/balcony view, preserving marble, checkerboard tiles and gorilla pendant |
| Tables / terrace | IMG_7677 | Restore the existing terrace layout and white lounge furniture |
| Match viewing | IMG_4765 | Responsive crops of the original bar and screen |
| Steam & sauna | No room reference in the supplied archive | A clearly labelled illustrative wellness detail; never depict an invented sauna room as the venue |
| Nightlife, entrance and parking | Existing originals | Keep the real photography already used on the website |

Built-in image generation is used for restoration and the illustrative detail.
Final prompts are kept in retouch-prompts.json; original files are retained.
Discard restorations that move fixed amenities or expand the scene.

Export responsive AVIF and progressive JPEG versions. Use focal points for
small screens, preserve image proportions, lazy-load below the fold, and avoid
upscaling exports beyond their source resolution. Full photo crops support the
keyboard-accessible gallery viewer. Illustration labels remain visible on
cards, booking pages and in the viewer.

Verify the homepage and all six amenity booking pages at phone and desktop
widths; check image decoding, links, crops, overflow, gallery keyboard controls,
focus return and reduced motion before publishing to main.
