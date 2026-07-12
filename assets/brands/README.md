# Official brand logos

Drop official logo image files into this folder, then list each filename in
`manifest.json` (see example below). The website automatically replaces the
designed monogram badges and marquee wordmarks with any logo listed here —
no HTML edits needed.

## Expected filenames

| Brand | Filename | Verified official logo URL |
|---|---|---|
| Nanak Foods | `nanak.png` | Check header logo at https://www.nanakfoods.com |
| MDH | `mdh.png` | https://www.mdhspices.com (site was unreachable; try later) |
| Veeba | `veeba.png` | https://veeba.in/cdn/shop/files/logo-transparent.png |
| Dabur | `dabur.png` | https://www.dabur.com/static/images/dabur-logo.png |
| Viswas | `viswas.png` | https://viswasfoods.in/assets/images/viswas-logo.png |
| Bhaiyaji's | `bhaiyajis.png` | https://images.squarespace-cdn.com/content/v1/61e00a1495bd4b199779ecef/04f89d1f-a37a-42a0-beda-7e8791c101aa/Group+122.png |
| Himalayan Momos | `himalayan-momos.png` | https://www.himalayanmomo.com/assets/img/logo_white.png (white — needs dark backing or a colored variant) |
| Wagh Bakri | `wagh-bakri.png` | https://www.waghbakritea.com/images/new-logo.svg (convert SVG to PNG) |
| Maggi | `maggi.png` | https://www.maggi.in/sites/default/files/maggi_logo_png_0.png |
| Ching's Secret | `chings.png` | Check https://chingssecret.com (logo loads dynamically) |
| Pachranga | `pachranga.png` | https://www.pachranga.net/wp-content/uploads/2019/07/pachranga-newlogo.png |
| Tamicon | `tamicon.png` | https://tamicon.in/wp-content/uploads/2024/08/LOGO-4.png |
| Rooh Afza | `rooh-afza.png` | https://hamdard.com/hamdard/images/roohafza-2023-brand-home.png |
| Ustad Banne Nawab | `ustad-banne-nawab.png` | Check https://www.ustadbannenawab.com |
| ARF Sweets | `arf-sweets.png` | Search official site |
| Indravati | `indravati.png` | Search official site |
| Taaza | `taaza.png` | Search official site |
| Anandbhogh | `anandbhogh.png` | Search official site |
| Premier | `premier.png` | Search official site |
| Century | `century.png` | Search official site |
| Kathiyawadi | `kathiyawadi.png` | Search official site |
| Apna | `apna.png` | Search official site |
| Banne Nawab | `banne-nawab.png` | Search official site |

## manifest.json example

```json
{
  "logos": [
    "nanak.png",
    "veeba.png",
    "dabur.png"
  ]
}
```

Only brands listed in `manifest.json` are swapped in; every other brand keeps
its designed badge. Prefer transparent PNGs around 300–600px wide. Note:
displaying vendor trademarks to indicate the brands you distribute is common
practice, but if a vendor has brand-usage guidelines, follow them.
