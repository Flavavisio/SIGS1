# Calculator revision · 2026-10-09

Scope: standalone CCTV disk calculator. Project engineering settings are unchanged.

Removed conflicting unused resolution/codec tables and fictional Uniview Ultra265 scene codecs. Ultra265 now defaults to the H.265 planning reference with no extra U-Code savings. Optional U-Code percentages are explicitly planning assumptions. None of the automatic Mbps values are manufacturer specifications: the baseline is MP × 2 Mbps at 25 fps for H.264, with H.265 at 50% and linear FPS scaling.

Measured average Mbps override automatic codec/FPS/scene adjustments, avoiding double compression or activity factors. Separate peak Mbps support network sizing; without measured peak, the UI asks to confirm peaks. Automatic scene estimation separates weighted mean from active-scene peak.

Storage bytes = mean Mbps × 1,000,000 / 8 × 3,600 × hours/day × days × event duty × quantity. Filesystem allowance, capacity reserve and margin multiply that value in order. Displayed GB/TB and disk capacities are decimal. Capacity reserve is not a RAID topology calculation. Optional available TB estimates retention with the same allowances. Added 6 MP for all calculator brands.

Validation: `tests/disk-v64.test.cjs`, existing `tests/engineering-v39.test.cjs`, static build and JS syntax checks.

Sources:
- Uniview calculation workflow: https://www.uniview.com/res/202309/11/20230911_1887723_How%20to%20Use%20the%20Calculation%20Function%20of%20EZTools_976479_168459_0.pdf
- U-Code scene-dependent savings: https://www.uniview.com/pt-br/Technology/201906/1028748_761258_0.htm
- Uniview logo: https://www.uniview.com/tres/images/2022/img/logo.svg
- Safire logo: https://brand.safirecctv.com/wp-content/uploads/2020/09/logo-horizontal.svg
- Hikvision logo: https://www.hikvision.com/etc/clientlibs/it/resources/font/hiknow-font.js
- Dahua logo: https://www.dahuasecurity.com/logo.png

Logos are hosted locally. Hikvision uses its official full vector symbol. The Dahua SVG container embeds the unchanged official PNG asset to avoid external requests.
