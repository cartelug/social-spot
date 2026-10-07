# Completion blueprint source

The editable 128-page plan is [../Social_Spot_Completion_Plan.md](../Social_Spot_Completion_Plan.md).
`plan_content.py` holds the specifications; `build_plan.py` renders the PDF and
regenerates the Markdown using the site's fonts and existing photographic archive.

From the repository root:

```sh
python3 -m pip install reportlab pillow pillow-heif 'fonttools[woff]'
python3 docs/completion-plan/build_plan.py
```

The PDF and per-page layout report are written to `../output/pdf/` outside the
checkout. The renderer embeds display-resolution JPEGs, preserves image aspect
ratios, checks page fit and adds a bookmark for each specification page. The final
PDF must also receive visual inspection after regeneration.

The plan distinguishes audited source, this visual release, proposed engineering
and owner decisions. It does not certify the deployment, claim academic
credentials or imply that the public brochure has an operational payment server.

Executed image prompts and provenance are in
`assets-src/photos/supporting-prompts-v2.json`. Future briefs for sauna interiors,
bedrooms, food and kids sessions require real source photographs and approved
facts before being presented as photographs of the venue.
