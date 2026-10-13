/* Thermal catalogue review: all 54 references, 2026-10-13.
 * Published SIP/VCA, DORI, temperature and illumination are separate quantities. */
(function(root){'use strict';
const patches=[
  {
    "brand": "safire",
    "mp": 5,
    "resW": 2592,
    "resH": 1944,
    "lensType": "fixed",
    "focalLength": 4.0,
    "baseLens": 4.0,
    "visibleLens": 4.0,
    "thermalLens": 3.2,
    "thermalResW": 256,
    "thermalResH": 192,
    "thermalFov": 56.0,
    "thermalVerticalFov": 42.2,
    "visibleFov": 81.0,
    "visibleVerticalFov": 56.7,
    "fov": 81.0,
    "verticalFov": 56.7,
    "visibleCoverageUnavailable": false,
    "visibleRange": 30.0,
    "range": 30.0,
    "irRange": 30.0,
    "thermalRange": 0,
    "thermalRangeBasis": "unknown",
    "thermalVehicleRange": 0,
    "thermalVehicleRangeBasis": "unknown",
    "thermalDetectionRange": 133.0,
    "thermalDetectionRangeBasis": "manufacturer-johnson-dori",
    "thermalVehicleDetectionRange": 409.0,
    "thermalVehicleDetectionRangeBasis": "manufacturer-johnson-dori",
    "poeW": 9,
    "poeStandard": "802.3af",
    "poeSupported": true,
    "powerSourceText": "DC 12 V, 0.7 A, 9 W max. PoE IEEE802.3af",
    "sourceURL": "https://www.visiotechsecurity.com/en/products/ip-cctv-1/thermal-411/safire-smart-747/sf-iptb256a-3d5-detail",
    "productURL": "https://www.visiotechsecurity.com/en/products/ip-cctv-1/thermal-411/safire-smart-747/sf-iptb256a-3d5-detail",
    "photoURL": "https://d1x12lhh8s9nlj.cloudfront.net/images/productos/products/SF-IPTB256A-3D5/SF-IPTB256A-3D5.png",
    "imgUrl": "https://d1x12lhh8s9nlj.cloudfront.net/images/productos/products/SF-IPTB256A-3D5/SF-IPTB256A-3D5.png",
    "analytics": {
      "people": true,
      "vehicles": true,
      "channel": "thermal",
      "label": "IA térmica · classificação de pessoas e veículos",
      "source": "https://www.visiotechsecurity.com/en/products/ip-cctv-1/thermal-411/safire-smart-747/sf-iptb256a-3d5-detail",
      "checked": "2026-10-13"
    },
    "desc": "IA de pessoas e veículos confirmada. A ficha publica DORI, mas não um alcance VCA por alvo. Térmica 256×192 nativo; visível 5 MP.",
    "thermalRangeConditions": "Alcance VCA não publicado; as distâncias DORI não são alcances de classificação IA.",
    "model": "SF-IPTB256A-3D5",
    "sourceChecked": "2026-10-13"
  },
  {
    "brand": "safire",
    "mp": 5,
    "resW": 2592,
    "resH": 1944,
    "lensType": "fixed",
    "focalLength": 8.0,
    "baseLens": 8.0,
    "visibleLens": 8.0,
    "thermalLens": 7.0,
    "thermalResW": 256,
    "thermalResH": 192,
    "thermalFov": 24.8,
    "thermalVerticalFov": 18.7,
    "visibleFov": 34.0,
    "visibleVerticalFov": 27.5,
    "fov": 34.0,
    "verticalFov": 27.5,
    "visibleCoverageUnavailable": false,
    "visibleRange": 30.0,
    "range": 30.0,
    "irRange": 30.0,
    "thermalRange": 0,
    "thermalRangeBasis": "unknown",
    "thermalVehicleRange": 0,
    "thermalVehicleRangeBasis": "unknown",
    "thermalDetectionRange": 292.0,
    "thermalDetectionRangeBasis": "manufacturer-johnson-dori",
    "thermalVehicleDetectionRange": 894.0,
    "thermalVehicleDetectionRangeBasis": "manufacturer-johnson-dori",
    "poeW": 9,
    "poeStandard": "802.3af",
    "poeSupported": true,
    "powerSourceText": "DC 12 V, 0.7 A, 9 W max. PoE IEEE802.3af",
    "sourceURL": "https://www.visiotechsecurity.com/en/products/ip-cctv-1/thermal-411/safire-smart-747/sf-iptb256a-7d5-detail",
    "productURL": "https://www.visiotechsecurity.com/en/products/ip-cctv-1/thermal-411/safire-smart-747/sf-iptb256a-7d5-detail",
    "photoURL": "https://d1x12lhh8s9nlj.cloudfront.net/images/productos/products/SF-IPTB256A-7D5/SF-IPTB256A-7D5.png",
    "imgUrl": "https://d1x12lhh8s9nlj.cloudfront.net/images/productos/products/SF-IPTB256A-7D5/SF-IPTB256A-7D5.png",
    "analytics": {
      "people": true,
      "vehicles": true,
      "channel": "thermal",
      "label": "IA térmica · classificação de pessoas e veículos",
      "source": "https://www.visiotechsecurity.com/en/products/ip-cctv-1/thermal-411/safire-smart-747/sf-iptb256a-7d5-detail",
      "checked": "2026-10-13"
    },
    "desc": "IA de pessoas e veículos confirmada. A ficha publica DORI, mas não um alcance VCA por alvo. Térmica 256×192 nativo; visível 5 MP.",
    "thermalRangeConditions": "Alcance VCA não publicado; as distâncias DORI não são alcances de classificação IA.",
    "model": "SF-IPTB256A-7D5",
    "sourceChecked": "2026-10-13"
  },
  {
    "brand": "safire",
    "mp": 5,
    "resW": 2592,
    "resH": 1944,
    "lensType": "fixed",
    "focalLength": 8.0,
    "baseLens": 8.0,
    "visibleLens": 8.0,
    "thermalLens": 9.0,
    "thermalResW": 384,
    "thermalResH": 288,
    "thermalFov": 28.4,
    "thermalVerticalFov": 21.5,
    "visibleFov": 38.0,
    "visibleVerticalFov": 27.5,
    "fov": 38.0,
    "verticalFov": 27.5,
    "visibleCoverageUnavailable": false,
    "visibleRange": 70.0,
    "range": 70.0,
    "irRange": 70.0,
    "thermalRange": 0,
    "thermalRangeBasis": "unknown",
    "thermalVehicleRange": 0,
    "thermalVehicleRangeBasis": "unknown",
    "thermalDetectionRange": 379.0,
    "thermalDetectionRangeBasis": "manufacturer-johnson-dori",
    "thermalVehicleDetectionRange": 1163.0,
    "thermalVehicleDetectionRangeBasis": "manufacturer-johnson-dori",
    "poeW": 9,
    "poeStandard": "802.3af",
    "poeSupported": true,
    "powerSourceText": "DC 12 V, 0.7 A, 9 W max. PoE IEEE802.3af",
    "sourceURL": "https://www.visiotechsecurity.com/en/products/ip-cctv-1/thermal-411/safire-smart-747/sf-iptb384a-9d5-detail",
    "productURL": "https://www.visiotechsecurity.com/en/products/ip-cctv-1/thermal-411/safire-smart-747/sf-iptb384a-9d5-detail",
    "photoURL": "https://d1x12lhh8s9nlj.cloudfront.net/images/productos/products/SF-IPTB384A-9D5/SF-IPTB384A-9D5.png",
    "imgUrl": "https://d1x12lhh8s9nlj.cloudfront.net/images/productos/products/SF-IPTB384A-9D5/SF-IPTB384A-9D5.png",
    "analytics": {
      "people": true,
      "vehicles": true,
      "channel": "thermal",
      "label": "IA térmica · classificação de pessoas e veículos",
      "source": "https://www.visiotechsecurity.com/en/products/ip-cctv-1/thermal-411/safire-smart-747/sf-iptb384a-9d5-detail",
      "checked": "2026-10-13"
    },
    "desc": "IA de pessoas e veículos confirmada. A ficha publica DORI, mas não um alcance VCA por alvo. Térmica 384×288 nativo; visível 5 MP.",
    "thermalRangeConditions": "Alcance VCA não publicado; as distâncias DORI não são alcances de classificação IA.",
    "model": "SF-IPTB384A-9D5",
    "sourceChecked": "2026-10-13"
  },
  {
    "brand": "safire",
    "mp": 5,
    "resW": 2592,
    "resH": 1944,
    "lensType": "fixed",
    "focalLength": 16.0,
    "baseLens": 16.0,
    "visibleLens": 16.0,
    "thermalLens": 19.0,
    "thermalResW": 384,
    "thermalResH": 288,
    "thermalFov": 13.8,
    "thermalVerticalFov": 10.4,
    "visibleFov": 19.8,
    "visibleVerticalFov": 14.3,
    "fov": 19.8,
    "verticalFov": 14.3,
    "visibleCoverageUnavailable": false,
    "visibleRange": 70.0,
    "range": 70.0,
    "irRange": 70.0,
    "thermalRange": 0,
    "thermalRangeBasis": "unknown",
    "thermalVehicleRange": 0,
    "thermalVehicleRangeBasis": "unknown",
    "thermalDetectionRange": 792.0,
    "thermalDetectionRangeBasis": "manufacturer-johnson-dori",
    "thermalVehicleDetectionRange": 2428.0,
    "thermalVehicleDetectionRangeBasis": "manufacturer-johnson-dori",
    "poeW": 9,
    "poeStandard": "802.3af",
    "poeSupported": true,
    "powerSourceText": "DC 12 V, 0.7 A, 9 W max. PoE IEEE802.3af",
    "sourceURL": "https://www.visiotechsecurity.com/en/products/ip-cctv-1/thermal-411/safire-smart-747/sf-iptb384a-19d5-detail",
    "productURL": "https://www.visiotechsecurity.com/en/products/ip-cctv-1/thermal-411/safire-smart-747/sf-iptb384a-19d5-detail",
    "photoURL": "https://d1x12lhh8s9nlj.cloudfront.net/images/productos/products/SF-IPTB384A-19D5/SF-IPTB384A-19D5.png",
    "imgUrl": "https://d1x12lhh8s9nlj.cloudfront.net/images/productos/products/SF-IPTB384A-19D5/SF-IPTB384A-19D5.png",
    "analytics": {
      "people": true,
      "vehicles": true,
      "channel": "thermal",
      "label": "IA térmica · classificação de pessoas e veículos",
      "source": "https://www.visiotechsecurity.com/en/products/ip-cctv-1/thermal-411/safire-smart-747/sf-iptb384a-19d5-detail",
      "checked": "2026-10-13"
    },
    "desc": "IA de pessoas e veículos confirmada. A ficha publica DORI, mas não um alcance VCA por alvo. Térmica 384×288 nativo; visível 5 MP.",
    "thermalRangeConditions": "Alcance VCA não publicado; as distâncias DORI não são alcances de classificação IA.",
    "model": "SF-IPTB384A-19D5",
    "sourceChecked": "2026-10-13"
  },
  {
    "brand": "safire",
    "mp": 5,
    "resW": 2592,
    "resH": 1944,
    "lensType": "fixed",
    "focalLength": 16.0,
    "baseLens": 16.0,
    "visibleLens": 16.0,
    "thermalLens": 25.0,
    "thermalResW": 384,
    "thermalResH": 288,
    "thermalFov": 10.5,
    "thermalVerticalFov": 7.9,
    "visibleFov": 0,
    "visibleVerticalFov": 0,
    "fov": 0,
    "verticalFov": 0,
    "visibleCoverageUnavailable": true,
    "visibleRange": 70.0,
    "range": 70.0,
    "irRange": 70.0,
    "thermalRange": 0,
    "thermalRangeBasis": "unknown",
    "thermalVehicleRange": 0,
    "thermalVehicleRangeBasis": "unknown",
    "thermalDetectionRange": 1042.0,
    "thermalDetectionRangeBasis": "manufacturer-johnson-dori",
    "thermalVehicleDetectionRange": 3194.0,
    "thermalVehicleDetectionRangeBasis": "manufacturer-johnson-dori",
    "poeW": 9,
    "poeStandard": "802.3af",
    "poeSupported": true,
    "powerSourceText": "DC 12 V, 0.7 A, 9 W max. PoE IEEE802.3af",
    "sourceURL": "https://www.visiotechsecurity.com/en/products/ip-cctv-1/thermal-411/safire-smart-747/sf-iptb384a-25d5-detail",
    "productURL": "https://www.visiotechsecurity.com/en/products/ip-cctv-1/thermal-411/safire-smart-747/sf-iptb384a-25d5-detail",
    "photoURL": "https://d1x12lhh8s9nlj.cloudfront.net/images/productos/products/SF-IPTB384A-25D5/SF-IPTB384A-25D5.png",
    "imgUrl": "https://d1x12lhh8s9nlj.cloudfront.net/images/productos/products/SF-IPTB384A-25D5/SF-IPTB384A-25D5.png",
    "analytics": {
      "people": true,
      "vehicles": true,
      "channel": "thermal",
      "label": "IA térmica · classificação de pessoas e veículos",
      "source": "https://www.visiotechsecurity.com/en/products/ip-cctv-1/thermal-411/safire-smart-747/sf-iptb384a-25d5-detail",
      "checked": "2026-10-13"
    },
    "desc": "IA de pessoas e veículos confirmada. A ficha publica DORI, mas não um alcance VCA por alvo. Térmica 384×288 nativo; visível 5 MP.",
    "thermalRangeConditions": "Alcance VCA não publicado; as distâncias DORI não são alcances de classificação IA.",
    "model": "SF-IPTB384A-25D5",
    "sourceChecked": "2026-10-13"
  },
  {
    "thermalVehicleRange": 200.0,
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalVehicleRangeTarget": "Veículo 1,4 × 4,0 m",
    "analytics": {
      "people": true,
      "vehicles": true,
      "channel": "thermal",
      "label": "VCA térmica · Pessoas e veículos",
      "source": "https://assets.hikvision.com/prd/public/all/doc/m000016375/DS-2TD2637-10_P_V5.5.30_20221115.pdf",
      "checked": "2026-10-13"
    },
    "model": "DS-2TD2637-10/P",
    "sourceChecked": "2026-10-13"
  },
  {
    "thermalVehicleRange": 309.0,
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalVehicleRangeTarget": "Veículo 1,4 × 4,0 m",
    "analytics": {
      "people": true,
      "vehicles": true,
      "channel": "thermal",
      "label": "VCA térmica · Pessoas e veículos",
      "source": "https://assets.hikvision.com/prd/public/all/doc/m000016376/DS-2TD2637-15_P_V5.5.30_20221115.pdf",
      "checked": "2026-10-13"
    },
    "model": "DS-2TD2637-15/P",
    "sourceChecked": "2026-10-13"
  },
  {
    "thermalVehicleRange": 515.0,
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalVehicleRangeTarget": "Veículo 1,4 × 4,0 m",
    "analytics": {
      "people": true,
      "vehicles": true,
      "channel": "thermal",
      "label": "VCA térmica · Pessoas e veículos",
      "source": "https://assets.hikvision.com/prd/public/all/doc/m000016377/DS-2TD2637-25_P_V5.5.30_20221115.pdf",
      "checked": "2026-10-13"
    },
    "model": "DS-2TD2637-25/P",
    "sourceChecked": "2026-10-13"
  },
  {
    "thermalRange": 30.0,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRange": 60.0,
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalRangeTarget": "Pessoa 1,8 × 0,5 m",
    "thermalVehicleRangeTarget": "Veículo 4 × 1,4 m",
    "analytics": {
      "people": true,
      "vehicles": true,
      "channel": "thermal",
      "label": "SIP térmica · Pessoas e veículos",
      "source": "https://www.uniview.com/Products/Thermal_Cameras/Bullet_Series/Bullet_Series/TIC2A32SA-F3-4F4AC-I1/",
      "checked": "2026-10-13"
    },
    "datasheetURL": "https://ubox-eu.oss-eu-central-1.aliyuncs.com/datacenter/doc/f46e143e-32dd-49ed-8acd-d1e94b2a0159/333060d3-b188-4d0e-87f6-51c741e5c8de.pdf",
    "model": "TIC2A32SA-F3-4F4AC-I1",
    "sourceChecked": "2026-10-13"
  },
  {
    "thermalRange": 70.0,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRange": 140.0,
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalRangeTarget": "Pessoa 1,8 × 0,5 m",
    "thermalVehicleRangeTarget": "Veículo 4 × 1,4 m",
    "analytics": {
      "people": true,
      "vehicles": true,
      "channel": "thermal",
      "label": "SIP térmica · Pessoas e veículos",
      "source": "https://www.uniview.com/Products/Thermal_Cameras/Bullet_Series/Bullet_Series/TIC2A32SA-F7-4F6AC-I1/",
      "checked": "2026-10-13"
    },
    "datasheetURL": "https://ubox-eu.oss-eu-central-1.aliyuncs.com/datacenter/doc/964c48e8-72f2-448c-918c-f4248b90039c/275305c9-7a1c-4275-b069-2b4ddf6f02ce.pdf",
    "model": "TIC2A32SA-F7-4F6AC-I1",
    "sourceChecked": "2026-10-13"
  },
  {
    "thermalRange": 100.0,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRange": 200.0,
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalRangeTarget": "Pessoa 1,8 × 0,5 m",
    "thermalVehicleRangeTarget": "Veículo 4 × 1,4 m",
    "analytics": {
      "people": true,
      "vehicles": true,
      "channel": "thermal",
      "label": "SIP térmica · Pessoas e veículos",
      "source": "https://www.uniview.com/Products/Thermal_Cameras/Bullet_Series/Bullet_Series/TIC2A32SA-F10-4F8AC-I1/",
      "checked": "2026-10-13"
    },
    "datasheetURL": "https://ubox-eu.oss-eu-central-1.aliyuncs.com/datacenter/doc/fcb7ad3f-4820-4a01-b577-3193801a2a24/3e7ba982-e46b-4a66-bd4d-be8a5d856188.pdf",
    "model": "TIC2A32SA-F10-4F8AC-I1",
    "sourceChecked": "2026-10-13"
  },
  {
    "thermalRange": 100.0,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRange": 200.0,
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalRangeTarget": "Pessoa 1,8 × 0,5 m",
    "thermalVehicleRangeTarget": "Veículo 4 × 1,4 m",
    "analytics": {
      "people": true,
      "vehicles": true,
      "channel": "thermal",
      "label": "SIP térmica · Pessoas e veículos",
      "source": "https://www.uniview.com/Products/Thermal_Cameras/Bullet_Series/Bullet_Series/TIC2624S-F10-4F6AC-I3/",
      "checked": "2026-10-13"
    },
    "datasheetURL": "https://ubox-eu.oss-eu-central-1.aliyuncs.com/datacenter/doc/e4059dd3-79e9-4fb5-b2e1-11d9c266604f/5a60a9e2-6a1d-4a6b-be77-5ad5130040fd.pdf",
    "model": "TIC2624S-F10-4F6AC-I3",
    "sourceChecked": "2026-10-13"
  },
  {
    "thermalRange": 250.0,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRange": 750.0,
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalRangeTarget": "Pessoa 1,8 × 0,5 m",
    "thermalVehicleRangeTarget": "Veículo 4 × 1,4 m",
    "analytics": {
      "people": true,
      "vehicles": true,
      "channel": "thermal",
      "label": "SIP térmica · Pessoas e veículos",
      "source": "https://www.uniview.com/Products/Thermal_Cameras/Bullet_Series/Bullet_Series/TIC2624S-F25-4F12AC-I3/",
      "checked": "2026-10-13"
    },
    "datasheetURL": "https://ubox-eu.oss-eu-central-1.aliyuncs.com/datacenter/doc/f88ef14b-75b0-4242-a041-f6c2a3e830a1/ec384cf5-d883-43fd-b07e-b2817b1b7ebd.pdf",
    "model": "TIC2624S-F25-4F12AC-I3",
    "sourceChecked": "2026-10-13"
  },
  {
    "thermalRange": 350.0,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRange": 1050.0,
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalRangeTarget": "Pessoa 1,8 × 0,5 m",
    "thermalVehicleRangeTarget": "Veículo 4 × 1,4 m",
    "analytics": {
      "people": true,
      "vehicles": true,
      "channel": "thermal",
      "label": "SIP térmica · Pessoas e veículos",
      "source": "https://www.uniview.com/Products/Thermal_Cameras/Bullet_Series/Bullet_Series/TIC2624S-F35-4F12AC-I3/",
      "checked": "2026-10-13"
    },
    "datasheetURL": "https://ubox-eu.oss-eu-central-1.aliyuncs.com/datacenter/doc/7a96be8a-dc5e-4dc1-8d81-d77d1513976e/52842fa9-341e-4372-b175-d0cc3d5958fb.pdf",
    "model": "TIC2624S-F35-4F12AC-I3",
    "sourceChecked": "2026-10-13"
  },
  {
    "model": "HM-TD2668-35/G1/T3Y",
    "thermalSourceNote": "A ficha é contraditória: o quadro de deteção indica 435 m para pessoas; a tabela VCA indica 455 m. O SIGS conserva 435 m como referência conservadora até esclarecimento do fabricante.",
    "sourceChecked": "2026-10-13"
  },
  {
    "model": "DS-2TD2628-3/QA",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "DS-2TD2628-7/QA",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "DS-2TD2628-10/QA",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "DS-2TD2637-10/P",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "DS-2TD2637-15/P",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "DS-2TD2637-25/P",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "TIC2A32SA-F3-4F4AC-I1",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "TIC2A32SA-F7-4F6AC-I1",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "TIC2A32SA-F10-4F8AC-I1",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "TIC2624S-F10-4F6AC-I3",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "TIC2624S-F25-4F12AC-I3",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "TIC2624S-F35-4F12AC-I3",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "TIC3612SA-F2-4F3AC-I1",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "TIC3612SA-F3-4F4AC-I1",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "TIC3612SA-F7-4F6AC-I1",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "TIC7626EL-GAF75-4X56-VH1",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "TIC2626S-F25-4F8AC-I3",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "TIC2626S-F10-4F4AC-I3",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "TIC2626S-F35-4F12AC-I3",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "HM-TD2638-4/G1/T3Y",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "HM-TD2638-8/G1/T3Y",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "HM-TD2638-10/G1/T3Y",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "HM-TD2638-15/G1/T3Y",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "HM-TD2638-25/G1/T3Y",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "HM-TD2638-35/G1/T3Y",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "HM-TD2668-10/G1/T3Y",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "HM-TD2668-15/G1/T3Y",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "HM-TD2668-25/G1/T3Y",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "HM-TD2668-35/G1/T3Y",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "DS-2TD1228-2/QA",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "DS-2TD1228-3/QA",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "DS-2TD1228T-2/QA(B)",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "DS-2TD2628T-3/QA",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "DS-2TD2617-6/QA",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "DS-2TD2628-7/QA/GLT",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "DS-2TD1228T-3/QA(B)",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "DS-2TD2628T-7/QA",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "DS-2TD1228-7/QA",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "DS-2TD1217-2/QA",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "DS-2TD2608-1/QA",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "DS-2TD2608-2/QA",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "DS-2TD2628-10/QA/GLT",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "DS-2TD4228T-7/S2",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "DS-2TD2528T-3/Q(C)",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "DS-2TD4137-25/WY(B)",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "DS-2TD4228T-10/S2",
    "thermalVcaReference": {
      "people": {
        "height": 1.8,
        "width": 0.5
      },
      "vehicles": {
        "height": 1.4,
        "width": 4
      }
    }
  },
  {
    "model": "SF-IPTB256A-3D5",
    "datasheetURL": "https://s3.eu-west-1.amazonaws.com/files.visiotech.es/files/pdf/SF-IPTB256A-3D5_EN.pdf",
    "thermalAnalyticsStatus": "available-range-unpublished",
    "thermalSourceNote": "PDF oficial revisto: confirma classificação térmica de pessoas/carros, mas não publica alcances VCA por alvo. As distâncias DRI/DORI são referências de imagem e não alcances certificados da analítica.",
    "sourceChecked": "2026-10-13"
  },
  {
    "model": "SF-IPTB256A-7D5",
    "datasheetURL": "https://s3.eu-west-1.amazonaws.com/files.visiotech.es/files/pdf/SF-IPTB256A-7D5_EN.pdf",
    "thermalAnalyticsStatus": "available-range-unpublished",
    "thermalSourceNote": "PDF oficial revisto: confirma classificação térmica de pessoas/carros, mas não publica alcances VCA por alvo. As distâncias DRI/DORI são referências de imagem e não alcances certificados da analítica.",
    "sourceChecked": "2026-10-13"
  },
  {
    "model": "SF-IPTB384A-9D5",
    "datasheetURL": "https://s3.eu-west-1.amazonaws.com/files.visiotech.es/files/pdf/SF-IPTB384A-9D5_EN.pdf",
    "thermalAnalyticsStatus": "available-range-unpublished",
    "thermalSourceNote": "PDF oficial revisto: confirma classificação térmica de pessoas/carros, mas não publica alcances VCA por alvo. As distâncias DRI/DORI são referências de imagem e não alcances certificados da analítica.",
    "sourceChecked": "2026-10-13"
  },
  {
    "model": "SF-IPTB384A-19D5",
    "datasheetURL": "https://s3.eu-west-1.amazonaws.com/files.visiotech.es/files/pdf/SF-IPTB384A-19D5_EN.pdf",
    "thermalAnalyticsStatus": "available-range-unpublished",
    "thermalSourceNote": "PDF oficial revisto: confirma classificação térmica de pessoas/carros, mas não publica alcances VCA por alvo. As distâncias DRI/DORI são referências de imagem e não alcances certificados da analítica.",
    "sourceChecked": "2026-10-13"
  },
  {
    "model": "SF-IPTB384A-25D5",
    "datasheetURL": "https://s3.eu-west-1.amazonaws.com/files.visiotech.es/files/pdf/SF-IPTB384A-25D5_EN.pdf",
    "thermalAnalyticsStatus": "available-range-unpublished",
    "thermalSourceNote": "PDF oficial revisto: confirma classificação térmica de pessoas/carros, mas não publica alcances VCA por alvo. As distâncias DRI/DORI são referências de imagem e não alcances certificados da analítica.",
    "sourceChecked": "2026-10-13"
  },
  {
    "model": "TIC2621SR-F3-4F4AC-VD",
    "datasheetURL": "https://ubox-eu.oss-eu-central-1.aliyuncs.com/datacenter/doc/e55ed2f9-7ec1-4b3b-847b-5f801c22a585/95098154-bcfc-43c6-ac21-670ad645d616.pdf",
    "thermalAnalyticsStatus": "available-range-unpublished",
    "thermalSourceNote": "PDF oficial revisto: confirma classificação térmica de pessoas/carros, mas não publica alcances VCA por alvo. As distâncias DRI/DORI são referências de imagem e não alcances certificados da analítica.",
    "sourceChecked": "2026-10-13"
  },
  {
    "model": "HM-TD3028T-2/Q(B)",
    "datasheetURL": "https://webassets.hikmicrotech.com/global/asset/93cebb3fafe94219b9ff2c34499f4858.pdf",
    "thermalAnalyticsStatus": "classification-not-documented",
    "thermalSourceNote": "Ficha oficial HIKMICRO de termografia: não documenta classificação de pessoas/carros. A tabela de alcance refere medição de temperatura de objetos, não VCA.",
    "sourceChecked": "2026-10-13",
    "thermalRangeConditions": "Ficha oficial HIKMICRO de termografia: não documenta classificação de pessoas/carros. A tabela de alcance refere medição de temperatura de objetos, não VCA."
  },
  {
    "model": "HM-TD3028T-3/Q(B)",
    "datasheetURL": "https://webassets.hikmicrotech.com/global/asset/81cab55638e247d79a9cf5d5078582e0.pdf",
    "thermalAnalyticsStatus": "classification-not-documented",
    "thermalSourceNote": "Ficha oficial HIKMICRO de termografia: não documenta classificação de pessoas/carros. A tabela de alcance refere medição de temperatura de objetos, não VCA.",
    "sourceChecked": "2026-10-13",
    "thermalRangeConditions": "Ficha oficial HIKMICRO de termografia: não documenta classificação de pessoas/carros. A tabela de alcance refere medição de temperatura de objetos, não VCA."
  }
],records=[
  {
    "model": "SF-IPTB256A-3D5",
    "brand": "safire",
    "thermalRange": 0,
    "thermalVehicleRange": 0,
    "thermalRangeBasis": "unknown",
    "thermalVehicleRangeBasis": "unknown",
    "thermalResW": 256,
    "thermalResH": 192,
    "thermalFov": 56.0,
    "thermalVerticalFov": 42.2,
    "sourceURL": "https://www.visiotechsecurity.com/en/products/ip-cctv-1/thermal-411/safire-smart-747/sf-iptb256a-3d5-detail",
    "datasheetURL": "https://s3.eu-west-1.amazonaws.com/files.visiotech.es/files/pdf/SF-IPTB256A-3D5_EN.pdf",
    "thermalAnalyticsStatus": "available-range-unpublished",
    "thermalSourceNote": "PDF oficial revisto: confirma classificação térmica de pessoas/carros, mas não publica alcances VCA por alvo. As distâncias DRI/DORI são referências de imagem e não alcances certificados da analítica.",
    "sourceChecked": "2026-10-13"
  },
  {
    "model": "SF-IPTB256A-7D5",
    "brand": "safire",
    "thermalRange": 0,
    "thermalVehicleRange": 0,
    "thermalRangeBasis": "unknown",
    "thermalVehicleRangeBasis": "unknown",
    "thermalResW": 256,
    "thermalResH": 192,
    "thermalFov": 24.8,
    "thermalVerticalFov": 18.7,
    "sourceURL": "https://www.visiotechsecurity.com/en/products/ip-cctv-1/thermal-411/safire-smart-747/sf-iptb256a-7d5-detail",
    "datasheetURL": "https://s3.eu-west-1.amazonaws.com/files.visiotech.es/files/pdf/SF-IPTB256A-7D5_EN.pdf",
    "thermalAnalyticsStatus": "available-range-unpublished",
    "thermalSourceNote": "PDF oficial revisto: confirma classificação térmica de pessoas/carros, mas não publica alcances VCA por alvo. As distâncias DRI/DORI são referências de imagem e não alcances certificados da analítica.",
    "sourceChecked": "2026-10-13"
  },
  {
    "model": "SF-IPTB384A-9D5",
    "brand": "safire",
    "thermalRange": 0,
    "thermalVehicleRange": 0,
    "thermalRangeBasis": "unknown",
    "thermalVehicleRangeBasis": "unknown",
    "thermalResW": 384,
    "thermalResH": 288,
    "thermalFov": 28.4,
    "thermalVerticalFov": 21.5,
    "sourceURL": "https://www.visiotechsecurity.com/en/products/ip-cctv-1/thermal-411/safire-smart-747/sf-iptb384a-9d5-detail",
    "datasheetURL": "https://s3.eu-west-1.amazonaws.com/files.visiotech.es/files/pdf/SF-IPTB384A-9D5_EN.pdf",
    "thermalAnalyticsStatus": "available-range-unpublished",
    "thermalSourceNote": "PDF oficial revisto: confirma classificação térmica de pessoas/carros, mas não publica alcances VCA por alvo. As distâncias DRI/DORI são referências de imagem e não alcances certificados da analítica.",
    "sourceChecked": "2026-10-13"
  },
  {
    "model": "SF-IPTB384A-19D5",
    "brand": "safire",
    "thermalRange": 0,
    "thermalVehicleRange": 0,
    "thermalRangeBasis": "unknown",
    "thermalVehicleRangeBasis": "unknown",
    "thermalResW": 384,
    "thermalResH": 288,
    "thermalFov": 13.8,
    "thermalVerticalFov": 10.4,
    "sourceURL": "https://www.visiotechsecurity.com/en/products/ip-cctv-1/thermal-411/safire-smart-747/sf-iptb384a-19d5-detail",
    "datasheetURL": "https://s3.eu-west-1.amazonaws.com/files.visiotech.es/files/pdf/SF-IPTB384A-19D5_EN.pdf",
    "thermalAnalyticsStatus": "available-range-unpublished",
    "thermalSourceNote": "PDF oficial revisto: confirma classificação térmica de pessoas/carros, mas não publica alcances VCA por alvo. As distâncias DRI/DORI são referências de imagem e não alcances certificados da analítica.",
    "sourceChecked": "2026-10-13"
  },
  {
    "model": "SF-IPTB384A-25D5",
    "brand": "safire",
    "thermalRange": 0,
    "thermalVehicleRange": 0,
    "thermalRangeBasis": "unknown",
    "thermalVehicleRangeBasis": "unknown",
    "thermalResW": 384,
    "thermalResH": 288,
    "thermalFov": 10.5,
    "thermalVerticalFov": 7.9,
    "sourceURL": "https://www.visiotechsecurity.com/en/products/ip-cctv-1/thermal-411/safire-smart-747/sf-iptb384a-25d5-detail",
    "datasheetURL": "https://s3.eu-west-1.amazonaws.com/files.visiotech.es/files/pdf/SF-IPTB384A-25D5_EN.pdf",
    "thermalAnalyticsStatus": "available-range-unpublished",
    "thermalSourceNote": "PDF oficial revisto: confirma classificação térmica de pessoas/carros, mas não publica alcances VCA por alvo. As distâncias DRI/DORI são referências de imagem e não alcances certificados da analítica.",
    "sourceChecked": "2026-10-13"
  },
  {
    "model": "DS-2TD2628-3/QA",
    "brand": "hikvision",
    "thermalRange": 28.8,
    "thermalVehicleRange": 75.6,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 256,
    "thermalResH": 192,
    "thermalFov": 50,
    "thermalVerticalFov": 37.3,
    "sourceURL": "https://www.visiotechsecurity.com/pt/produtos/cctv-ip-1/solucões-ip-278/proteccão-perimetral-280/ds-2td2628-3_qa-detail",
    "datasheetURL": null
  },
  {
    "model": "DS-2TD2628-7/QA",
    "brand": "hikvision",
    "thermalRange": 55.2,
    "thermalVehicleRange": 144.9,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 256,
    "thermalResH": 192,
    "thermalFov": 24.9,
    "thermalVerticalFov": 18.7,
    "sourceURL": "https://www.visiotechsecurity.com/pt/produtos/cctv-ip-1/solucões-ip-278/proteccão-perimetral-280/ds-2td2628-7_qa-detail",
    "datasheetURL": "https://assets.hikvision.com/prd/public/all/doc/m000056169/DS-2TD2628-7_QA_Datasheet_en-US_20231007.pdf"
  },
  {
    "model": "DS-2TD2628-10/QA",
    "brand": "hikvision",
    "thermalRange": 77.6,
    "thermalVehicleRange": 203.7,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 256,
    "thermalResH": 192,
    "thermalFov": 18,
    "thermalVerticalFov": 13.5,
    "sourceURL": "https://www.visiotechsecurity.com/pt/produtos/cctv-ip-1/solucões-ip-278/proteccão-perimetral-280/ds-2td2628-10_qa-detail",
    "datasheetURL": null
  },
  {
    "model": "DS-2TD2637-10/P",
    "brand": "hikvision",
    "thermalRange": 71,
    "thermalVehicleRange": 200.0,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 384,
    "thermalResH": 288,
    "thermalFov": 37.5,
    "thermalVerticalFov": 28.5,
    "sourceURL": "https://assets.hikvision.com/prd/public/all/doc/m000016375/DS-2TD2637-10_P_V5.5.30_20221115.pdf",
    "datasheetURL": null
  },
  {
    "model": "DS-2TD2637-15/P",
    "brand": "hikvision",
    "thermalRange": 110,
    "thermalVehicleRange": 309.0,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 384,
    "thermalResH": 288,
    "thermalFov": 24.5,
    "thermalVerticalFov": 18.5,
    "sourceURL": "https://assets.hikvision.com/prd/public/all/doc/m000016376/DS-2TD2637-15_P_V5.5.30_20221115.pdf",
    "datasheetURL": null
  },
  {
    "model": "DS-2TD2637-25/P",
    "brand": "hikvision",
    "thermalRange": 184,
    "thermalVehicleRange": 515.0,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 384,
    "thermalResH": 288,
    "thermalFov": 14.9,
    "thermalVerticalFov": 11.2,
    "sourceURL": "https://assets.hikvision.com/prd/public/all/doc/m000016377/DS-2TD2637-25_P_V5.5.30_20221115.pdf",
    "datasheetURL": null
  },
  {
    "model": "TIC2A32SA-F3-4F4AC-I1",
    "brand": "uniview",
    "thermalRange": 30.0,
    "thermalVehicleRange": 60.0,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 256,
    "thermalResH": 192,
    "thermalFov": 58,
    "thermalVerticalFov": 42.5,
    "sourceURL": "https://www.uniview.com/Products/Thermal_Cameras/Bullet_Series/Bullet_Series/TIC2A32SA-F3-4F4AC-I1/",
    "datasheetURL": "https://ubox-eu.oss-eu-central-1.aliyuncs.com/datacenter/doc/f46e143e-32dd-49ed-8acd-d1e94b2a0159/333060d3-b188-4d0e-87f6-51c741e5c8de.pdf"
  },
  {
    "model": "TIC2A32SA-F7-4F6AC-I1",
    "brand": "uniview",
    "thermalRange": 70.0,
    "thermalVehicleRange": 140.0,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 256,
    "thermalResH": 192,
    "thermalFov": 25.2,
    "thermalVerticalFov": 19.3,
    "sourceURL": "https://www.uniview.com/Products/Thermal_Cameras/Bullet_Series/Bullet_Series/TIC2A32SA-F7-4F6AC-I1/",
    "datasheetURL": "https://ubox-eu.oss-eu-central-1.aliyuncs.com/datacenter/doc/964c48e8-72f2-448c-918c-f4248b90039c/275305c9-7a1c-4275-b069-2b4ddf6f02ce.pdf"
  },
  {
    "model": "TIC2A32SA-F10-4F8AC-I1",
    "brand": "uniview",
    "thermalRange": 100.0,
    "thermalVehicleRange": 200.0,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 256,
    "thermalResH": 192,
    "thermalFov": 17.5,
    "thermalVerticalFov": 10.4,
    "sourceURL": "https://www.uniview.com/Products/Thermal_Cameras/Bullet_Series/Bullet_Series/TIC2A32SA-F10-4F8AC-I1/",
    "datasheetURL": "https://ubox-eu.oss-eu-central-1.aliyuncs.com/datacenter/doc/fcb7ad3f-4820-4a01-b577-3193801a2a24/3e7ba982-e46b-4a66-bd4d-be8a5d856188.pdf"
  },
  {
    "model": "TIC2624S-F10-4F6AC-I3",
    "brand": "uniview",
    "thermalRange": 100.0,
    "thermalVehicleRange": 200.0,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 400,
    "thermalResH": 300,
    "thermalFov": 30,
    "thermalVerticalFov": 22.9,
    "sourceURL": "https://www.uniview.com/Products/Thermal_Cameras/Bullet_Series/Bullet_Series/TIC2624S-F10-4F6AC-I3/",
    "datasheetURL": "https://ubox-eu.oss-eu-central-1.aliyuncs.com/datacenter/doc/e4059dd3-79e9-4fb5-b2e1-11d9c266604f/5a60a9e2-6a1d-4a6b-be77-5ad5130040fd.pdf"
  },
  {
    "model": "TIC2624S-F25-4F12AC-I3",
    "brand": "uniview",
    "thermalRange": 250.0,
    "thermalVehicleRange": 750.0,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 400,
    "thermalResH": 300,
    "thermalFov": 10.9,
    "thermalVerticalFov": 8.3,
    "sourceURL": "https://www.uniview.com/Products/Thermal_Cameras/Bullet_Series/Bullet_Series/TIC2624S-F25-4F12AC-I3/",
    "datasheetURL": "https://ubox-eu.oss-eu-central-1.aliyuncs.com/datacenter/doc/f88ef14b-75b0-4242-a041-f6c2a3e830a1/ec384cf5-d883-43fd-b07e-b2817b1b7ebd.pdf"
  },
  {
    "model": "TIC2624S-F35-4F12AC-I3",
    "brand": "uniview",
    "thermalRange": 350.0,
    "thermalVehicleRange": 1050.0,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 400,
    "thermalResH": 300,
    "thermalFov": 7.7,
    "thermalVerticalFov": 5.8,
    "sourceURL": "https://www.uniview.com/Products/Thermal_Cameras/Bullet_Series/Bullet_Series/TIC2624S-F35-4F12AC-I3/",
    "datasheetURL": "https://ubox-eu.oss-eu-central-1.aliyuncs.com/datacenter/doc/7a96be8a-dc5e-4dc1-8d81-d77d1513976e/52842fa9-341e-4372-b175-d0cc3d5958fb.pdf"
  },
  {
    "model": "TIC3612SA-F2-4F3AC-I1",
    "brand": "uniview",
    "thermalRange": 21,
    "thermalVehicleRange": 42,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 256,
    "thermalResH": 192,
    "thermalFov": 88.8,
    "thermalVerticalFov": 63.7,
    "sourceURL": "https://www.uniview.com/Products/Thermal_Cameras/Turret_series/Turret_series/TIC3612SA-F2-4F3AC-I1/",
    "datasheetURL": "https://ubox-eu.oss-eu-central-1.aliyuncs.com/datacenter/doc/3b9fc926-cead-42e9-8746-65615f9648d1/42299e55-6f3d-4e6c-bec4-7d487dc35fe9.pdf"
  },
  {
    "model": "TIC3612SA-F3-4F4AC-I1",
    "brand": "uniview",
    "thermalRange": 30,
    "thermalVehicleRange": 60,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 256,
    "thermalResH": 192,
    "thermalFov": 58,
    "thermalVerticalFov": 42.5,
    "sourceURL": "https://www.uniview.com/Products/Thermal_Cameras/Turret_series/Turret_series/TIC3612SA-F3-4F4AC-I1/",
    "datasheetURL": "https://ubox-eu.oss-eu-central-1.aliyuncs.com/datacenter/doc/5c8a525e-ce09-477a-893c-61981a4570bb/bd3b09f9-c4a9-49e9-9201-f0e21a652777.pdf"
  },
  {
    "model": "TIC3612SA-F7-4F6AC-I1",
    "brand": "uniview",
    "thermalRange": 70,
    "thermalVehicleRange": 140,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 256,
    "thermalResH": 192,
    "thermalFov": 25.2,
    "thermalVerticalFov": 19.3,
    "sourceURL": "https://www.uniview.com/Products/Thermal_Cameras/Turret_series/Turret_series/TIC3612SA-F7-4F6AC-I1/",
    "datasheetURL": "https://ubox-eu.oss-eu-central-1.aliyuncs.com/datacenter/doc/8d92315d-6563-46a0-aa3a-07cf19349b1f/6a4b9df2-7986-4ca0-b071-684ae105d0e5.pdf"
  },
  {
    "model": "TIC7626EL-GAF75-4X56-VH1",
    "brand": "uniview",
    "thermalRange": 750,
    "thermalVehicleRange": 1500,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 640,
    "thermalResH": 512,
    "thermalFov": 6.1,
    "thermalVerticalFov": 4.8,
    "sourceURL": "https://www.uniview.com/Products/Thermal_Cameras/Positioning_System/Positioning_System/TIC7626EL-GAF75-4X56-VH1/",
    "datasheetURL": "https://ubox-eu.oss-eu-central-1.aliyuncs.com/datacenter/doc/26bb5066-d28b-4c2d-88e6-a1a55a628d90/f259976c-cd72-4f49-b522-cde246193cda.pdf"
  },
  {
    "model": "TIC2621SR-F3-4F4AC-VD",
    "brand": "uniview",
    "thermalRange": null,
    "thermalVehicleRange": null,
    "thermalRangeBasis": "unknown",
    "thermalVehicleRangeBasis": "unknown",
    "thermalResW": 256,
    "thermalResH": 192,
    "thermalFov": 57,
    "thermalVerticalFov": 42,
    "sourceURL": "https://www.uniview.com/Products/Thermal_Cameras/Bullet_Series/Bullet_Series/TIC2621SR-F3-4F4AC-VD/",
    "datasheetURL": "https://ubox-eu.oss-eu-central-1.aliyuncs.com/datacenter/doc/e55ed2f9-7ec1-4b3b-847b-5f801c22a585/95098154-bcfc-43c6-ac21-670ad645d616.pdf",
    "thermalAnalyticsStatus": "available-range-unpublished",
    "thermalSourceNote": "PDF oficial revisto: confirma classificação térmica de pessoas/carros, mas não publica alcances VCA por alvo. As distâncias DRI/DORI são referências de imagem e não alcances certificados da analítica.",
    "sourceChecked": "2026-10-13"
  },
  {
    "model": "TIC2626S-F25-4F8AC-I3",
    "brand": "uniview",
    "thermalRange": 250,
    "thermalVehicleRange": 750,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 640,
    "thermalResH": 512,
    "thermalFov": 17.4,
    "thermalVerticalFov": 14,
    "sourceURL": "https://www.uniview.com/Products/Thermal_Cameras/Bullet_Series/Bullet_Series/TIC2626S-F25-4F8AC-I3/",
    "datasheetURL": "https://ubox-eu.oss-eu-central-1.aliyuncs.com/datacenter/doc/4cf5164c-b0d7-40c4-981a-6d18ea0d5c74/d8a2aac7-c076-44ec-8ab9-a0183cd4c8ca.pdf"
  },
  {
    "model": "TIC2626S-F10-4F4AC-I3",
    "brand": "uniview",
    "thermalRange": 100,
    "thermalVehicleRange": 200,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 640,
    "thermalResH": 512,
    "thermalFov": 48,
    "thermalVerticalFov": 38.3,
    "sourceURL": "https://www.uniview.com/Products/Thermal_Cameras/Bullet_Series/Bullet_Series/TIC2626S-F10-4F4AC-I3/",
    "datasheetURL": "https://ubox-eu.oss-eu-central-1.aliyuncs.com/datacenter/doc/af7e5078-47ea-4917-9b59-c25158845122/f33d45a7-135c-4d63-be22-2ecdd611c909.pdf"
  },
  {
    "model": "TIC2626S-F35-4F12AC-I3",
    "brand": "uniview",
    "thermalRange": 350,
    "thermalVehicleRange": 1050,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 640,
    "thermalResH": 512,
    "thermalFov": 12.2,
    "thermalVerticalFov": 8.5,
    "sourceURL": "https://www.uniview.com/Products/Thermal_Cameras/Bullet_Series/Bullet_Series/TIC2626S-F35-4F12AC-I3/",
    "datasheetURL": "https://ubox-eu.oss-eu-central-1.aliyuncs.com/datacenter/doc/72bbd735-6b11-4677-941e-c3eb6c988dd1/0350ccd4-8f84-4681-96df-94460ad35b86.pdf"
  },
  {
    "model": "HM-TD2638-4/G1/T3Y",
    "brand": "hikmicro",
    "thermalRange": 52,
    "thermalVehicleRange": 120,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 384,
    "thermalResH": 288,
    "thermalFov": 60.2,
    "thermalVerticalFov": 40.6,
    "sourceURL": "https://assets.hikvision.com/prd/public/all/doc/m000172647/HM-TD2638-4-G1-T3Y_Datasheet_20250626.pdf",
    "datasheetURL": "https://assets.hikvision.com/prd/public/all/doc/m000172647/HM-TD2638-4-G1-T3Y_Datasheet_20250626.pdf"
  },
  {
    "model": "HM-TD2638-8/G1/T3Y",
    "brand": "hikmicro",
    "thermalRange": 104,
    "thermalVehicleRange": 240,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 384,
    "thermalResH": 288,
    "thermalFov": 35,
    "thermalVerticalFov": 26.1,
    "sourceURL": "https://assets.hikvision.com/prd/normal/all/doc/m000172648/pt-pt/HM-TD2638-8_G1_T3Y_Datasheet_en-US_20250717.pdf",
    "datasheetURL": "https://assets.hikvision.com/prd/normal/all/doc/m000172648/pt-pt/HM-TD2638-8_G1_T3Y_Datasheet_en-US_20250717.pdf"
  },
  {
    "model": "HM-TD2638-10/G1/T3Y",
    "brand": "hikmicro",
    "thermalRange": 130,
    "thermalVehicleRange": 300,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 384,
    "thermalResH": 288,
    "thermalFov": 26.5,
    "thermalVerticalFov": 19.8,
    "sourceURL": "https://assets.hikvision.com/prd/public/all/doc/m000172438/HM-TD2638-10-G1-T3Y_Datasheet_20250626.pdf",
    "datasheetURL": "https://assets.hikvision.com/prd/public/all/doc/m000172438/HM-TD2638-10-G1-T3Y_Datasheet_20250626.pdf"
  },
  {
    "model": "HM-TD2638-15/G1/T3Y",
    "brand": "hikmicro",
    "thermalRange": 195,
    "thermalVehicleRange": 450,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 384,
    "thermalResH": 288,
    "thermalFov": 17,
    "thermalVerticalFov": 12.8,
    "sourceURL": "https://assets.hikvision.com/prd/public/all/doc/m000172649/HM-TD2638-15-G1-T3Y_Datasheet_20250626.pdf",
    "datasheetURL": "https://assets.hikvision.com/prd/public/all/doc/m000172649/HM-TD2638-15-G1-T3Y_Datasheet_20250626.pdf"
  },
  {
    "model": "HM-TD2638-25/G1/T3Y",
    "brand": "hikmicro",
    "thermalRange": 325,
    "thermalVehicleRange": 750,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 384,
    "thermalResH": 288,
    "thermalFov": 10.5,
    "thermalVerticalFov": 7.9,
    "sourceURL": "https://assets.hikvision.com/prd/public/all/doc/m000172650/HM-TD2638-25-G1-T3Y_Datasheet_20250626.pdf",
    "datasheetURL": "https://assets.hikvision.com/prd/public/all/doc/m000172650/HM-TD2638-25-G1-T3Y_Datasheet_20250626.pdf"
  },
  {
    "model": "HM-TD2638-35/G1/T3Y",
    "brand": "hikmicro",
    "thermalRange": 455,
    "thermalVehicleRange": 1050,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 384,
    "thermalResH": 288,
    "thermalFov": 7.5,
    "thermalVerticalFov": 5.6,
    "sourceURL": "https://assets.hikvision.com/prd/public/all/doc/m000172651/HM-TD2638-35-G1-T3Y_Datasheet_20250626.pdf",
    "datasheetURL": "https://assets.hikvision.com/prd/public/all/doc/m000172651/HM-TD2638-35-G1-T3Y_Datasheet_20250626.pdf"
  },
  {
    "model": "HM-TD2668-10/G1/T3Y",
    "brand": "hikmicro",
    "thermalRange": 130,
    "thermalVehicleRange": 300,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 640,
    "thermalResH": 512,
    "thermalFov": 45.1,
    "thermalVerticalFov": 35.7,
    "sourceURL": "https://assets.hikvision.com/prd/public/all/doc/m000172636/HM-TD2668-10-G1-T3Y_Datasheet_20250701.pdf",
    "datasheetURL": "https://assets.hikvision.com/prd/public/all/doc/m000172636/HM-TD2668-10-G1-T3Y_Datasheet_20250701.pdf"
  },
  {
    "model": "HM-TD2668-15/G1/T3Y",
    "brand": "hikmicro",
    "thermalRange": 195,
    "thermalVehicleRange": 450,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 640,
    "thermalResH": 512,
    "thermalFov": 29.3,
    "thermalVerticalFov": 23.4,
    "sourceURL": "https://assets.hikvision.com/prd/public/all/doc/m000172637/HM-TD2668-15-G1-T3Y_Datasheet_20250701.pdf",
    "datasheetURL": "https://assets.hikvision.com/prd/public/all/doc/m000172637/HM-TD2668-15-G1-T3Y_Datasheet_20250701.pdf"
  },
  {
    "model": "HM-TD2668-25/G1/T3Y",
    "brand": "hikmicro",
    "thermalRange": 325,
    "thermalVehicleRange": 750,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 640,
    "thermalResH": 512,
    "thermalFov": 17.4,
    "thermalVerticalFov": 13.9,
    "sourceURL": "https://assets.hikvision.com/prd/public/all/doc/m000172638/HM-TD2668-25-G1-T3Y_Datasheet_20250701.pdf",
    "datasheetURL": "https://assets.hikvision.com/prd/public/all/doc/m000172638/HM-TD2668-25-G1-T3Y_Datasheet_20250701.pdf"
  },
  {
    "model": "HM-TD2668-35/G1/T3Y",
    "brand": "hikmicro",
    "thermalRange": 435,
    "thermalVehicleRange": 1050,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 640,
    "thermalResH": 512,
    "thermalFov": 12.4,
    "thermalVerticalFov": 10,
    "sourceURL": "https://assets.hikvision.com/prd/public/all/doc/m000172639/HM-TD2668-35-G1-T3Y_Datasheet_20250701.pdf",
    "datasheetURL": "https://assets.hikvision.com/prd/public/all/doc/m000172639/HM-TD2668-35-G1-T3Y_Datasheet_20250701.pdf"
  },
  {
    "model": "DS-2TD1228-2/QA",
    "brand": "hikvision",
    "thermalRange": 16.8,
    "thermalVehicleRange": 50.4,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 256,
    "thermalResH": 192,
    "thermalFov": 90,
    "thermalVerticalFov": 65.4,
    "sourceURL": "https://www.visiotechsecurity.com/pt/produtos/cctv-ip-1/solucões-ip-278/proteccão-perimetral-280/ds-2td1228-2_qa-detail",
    "datasheetURL": "https://assets.hikvision.com/prd/public/all/doc/m000044933/DS-2TD1228-2_QA_Datasheet_en-US_20231019.pdf"
  },
  {
    "model": "DS-2TD1228-3/QA",
    "brand": "hikvision",
    "thermalRange": 28.4,
    "thermalVehicleRange": 75.6,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 256,
    "thermalResH": 192,
    "thermalFov": 50,
    "thermalVerticalFov": 37.3,
    "sourceURL": "https://www.visiotechsecurity.com/pt/produtos/cctv-ip-1/solucões-ip-278/proteccão-perimetral-280/ds-2td1228-3_qa-detail",
    "datasheetURL": "https://assets.hikvision.com/prd/public/all/doc/m000044934/DS-2TD1228-3_QA_Datasheet_en-US_20231019.pdf"
  },
  {
    "model": "DS-2TD1228T-2/QA(B)",
    "brand": "hikvision",
    "thermalRange": 16.8,
    "thermalVehicleRange": 50.4,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 256,
    "thermalResH": 192,
    "thermalFov": 90,
    "thermalVerticalFov": 65.4,
    "sourceURL": "https://www.visiotechsecurity.com/pt/produtos/cctv-ip-1/solucões-ip-278/proteccão-perimetral-280/ds-2td1228t-2_qa(b)-detail",
    "datasheetURL": null
  },
  {
    "model": "DS-2TD2628T-3/QA",
    "brand": "hikvision",
    "thermalRange": 28.4,
    "thermalVehicleRange": 75.6,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 256,
    "thermalResH": 192,
    "thermalFov": 50,
    "thermalVerticalFov": 37.3,
    "sourceURL": "https://www.visiotechsecurity.com/pt/produtos/cctv-ip-1/solucões-ip-278/proteccão-perimetral-280/ds-2td2628t-3_qa-detail",
    "datasheetURL": null
  },
  {
    "model": "DS-2TD2617-6/QA",
    "brand": "hikvision",
    "thermalRange": 30,
    "thermalVehicleRange": 85,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 160,
    "thermalResH": 120,
    "thermalFov": 25,
    "thermalVerticalFov": 18.7,
    "sourceURL": "https://www.visiotechsecurity.com/pt/produtos/cctv-ip-1/solucões-ip-278/proteccão-perimetral-280/ds-2td2617-6_qa-detail",
    "datasheetURL": null
  },
  {
    "model": "DS-2TD2628-7/QA/GLT",
    "brand": "hikvision",
    "thermalRange": 55.2,
    "thermalVehicleRange": 144.9,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 256,
    "thermalResH": 192,
    "thermalFov": 24.9,
    "thermalVerticalFov": 18.7,
    "sourceURL": "https://www.visiotechsecurity.com/pt/produtos/cctv-ip-1/solucões-ip-278/proteccão-perimetral-280/ds-2td2628-7_qa_glt-detail",
    "datasheetURL": null
  },
  {
    "model": "DS-2TD1228T-3/QA(B)",
    "brand": "hikvision",
    "thermalRange": 28.4,
    "thermalVehicleRange": 75.6,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 256,
    "thermalResH": 192,
    "thermalFov": 50,
    "thermalVerticalFov": 37.3,
    "sourceURL": "https://www.visiotechsecurity.com/pt/produtos/cctv-ip-1/solucões-ip-278/proteccão-perimetral-280/ds-2td1228t-3_qa(b)-detail",
    "datasheetURL": null
  },
  {
    "model": "DS-2TD2628T-7/QA",
    "brand": "hikvision",
    "thermalRange": 55.2,
    "thermalVehicleRange": 144.9,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 256,
    "thermalResH": 192,
    "thermalFov": 24.9,
    "thermalVerticalFov": 18.7,
    "sourceURL": "https://www.visiotechsecurity.com/pt/produtos/cctv-ip-1/solucões-ip-278/proteccão-perimetral-280/ds-2td2628t-7_qa-detail",
    "datasheetURL": null
  },
  {
    "model": "DS-2TD1228-7/QA",
    "brand": "hikvision",
    "thermalRange": 55.2,
    "thermalVehicleRange": 144.9,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 256,
    "thermalResH": 192,
    "thermalFov": 24.9,
    "thermalVerticalFov": 18.7,
    "sourceURL": "https://www.visiotechsecurity.com/pt/produtos/cctv-ip-1/solucões-ip-278/proteccão-perimetral-280/ds-2td1228-7_qa-detail",
    "datasheetURL": null
  },
  {
    "model": "HM-TD3028T-2/Q(B)",
    "brand": "hikvision",
    "thermalRange": 0,
    "thermalVehicleRange": 0,
    "thermalRangeBasis": "not-published",
    "thermalVehicleRangeBasis": "not-published",
    "thermalResW": 256,
    "thermalResH": 192,
    "thermalFov": 90,
    "thermalVerticalFov": 64.2,
    "sourceURL": "https://www.visiotechsecurity.com/pt/produtos/cctv-ip-1/solucões-ip-278/proteccão-perimetral-280/hm-td3028t-2_q(b)-detail",
    "datasheetURL": "https://webassets.hikmicrotech.com/global/asset/93cebb3fafe94219b9ff2c34499f4858.pdf",
    "thermalAnalyticsStatus": "classification-not-documented",
    "thermalSourceNote": "Ficha oficial HIKMICRO de termografia: não documenta classificação de pessoas/carros. A tabela de alcance refere medição de temperatura de objetos, não VCA.",
    "sourceChecked": "2026-10-13",
    "thermalRangeConditions": "Ficha oficial HIKMICRO de termografia: não documenta classificação de pessoas/carros. A tabela de alcance refere medição de temperatura de objetos, não VCA."
  },
  {
    "model": "DS-2TD1217-2/QA",
    "brand": "hikvision",
    "thermalRange": 10,
    "thermalVehicleRange": 30,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 160,
    "thermalResH": 120,
    "thermalFov": 90,
    "thermalVerticalFov": 66.4,
    "sourceURL": "https://www.visiotechsecurity.com/pt/produtos/cctv-ip-1/solucões-ip-278/proteccão-perimetral-280/ds-2td1217-2_qa-detail",
    "datasheetURL": null
  },
  {
    "model": "DS-2TD2608-1/QA",
    "brand": "hikvision",
    "thermalRange": 11,
    "thermalVehicleRange": 33,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 96,
    "thermalResH": 72,
    "thermalFov": 50,
    "thermalVerticalFov": 37.5,
    "sourceURL": "https://www.visiotechsecurity.com/pt/produtos/cctv-ip-1/solucões-ip-278/proteccão-perimetral-280/ds-2td2608-1_qa-detail",
    "datasheetURL": null
  },
  {
    "model": "DS-2TD2608-2/QA",
    "brand": "hikvision",
    "thermalRange": 21,
    "thermalVehicleRange": 63,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 96,
    "thermalResH": 72,
    "thermalFov": 25,
    "thermalVerticalFov": 18.75,
    "sourceURL": "https://www.visiotechsecurity.com/pt/produtos/cctv-ip-1/solucões-ip-278/proteccão-perimetral-280/ds-2td2608-2_qa-detail",
    "datasheetURL": null
  },
  {
    "model": "DS-2TD2628-10/QA/GLT",
    "brand": "hikvision",
    "thermalRange": 77.6,
    "thermalVehicleRange": 203.7,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 256,
    "thermalResH": 192,
    "thermalFov": 18,
    "thermalVerticalFov": 13.5,
    "sourceURL": "https://www.visiotechsecurity.com/pt/produtos/cctv-ip-1/solucões-ip-278/proteccão-perimetral-280/ds-2td2628-10_qa_glt-detail",
    "datasheetURL": null
  },
  {
    "model": "HM-TD3028T-3/Q(B)",
    "brand": "hikvision",
    "thermalRange": 0,
    "thermalVehicleRange": 0,
    "thermalRangeBasis": "not-published",
    "thermalVehicleRangeBasis": "not-published",
    "thermalResW": 256,
    "thermalResH": 192,
    "thermalFov": 50,
    "thermalVerticalFov": 37.2,
    "sourceURL": "https://www.visiotechsecurity.com/pt/produtos/cctv-ip-1/solucões-ip-278/proteccão-perimetral-280/hm-td3028t-3_q(b)-detail",
    "datasheetURL": "https://webassets.hikmicrotech.com/global/asset/81cab55638e247d79a9cf5d5078582e0.pdf",
    "thermalAnalyticsStatus": "classification-not-documented",
    "thermalSourceNote": "Ficha oficial HIKMICRO de termografia: não documenta classificação de pessoas/carros. A tabela de alcance refere medição de temperatura de objetos, não VCA.",
    "sourceChecked": "2026-10-13",
    "thermalRangeConditions": "Ficha oficial HIKMICRO de termografia: não documenta classificação de pessoas/carros. A tabela de alcance refere medição de temperatura de objetos, não VCA."
  },
  {
    "model": "DS-2TD4228T-7/S2",
    "brand": "hikvision",
    "thermalRange": 56,
    "thermalVehicleRange": 168,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 256,
    "thermalResH": 192,
    "thermalFov": 25,
    "thermalVerticalFov": 18.8,
    "sourceURL": "https://www.visiotechsecurity.com/pt/produtos/cctv-ip-1/solucões-ip-278/proteccão-perimetral-280/ds-2td4228t-7_s2-detail",
    "datasheetURL": null
  },
  {
    "model": "DS-2TD2528T-3/Q(C)",
    "brand": "hikvision",
    "thermalRange": 24,
    "thermalVehicleRange": 72,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 256,
    "thermalResH": 192,
    "thermalFov": 50,
    "thermalVerticalFov": 37.3,
    "sourceURL": "https://www.visiotechsecurity.com/pt/produtos/cctv-ip-1/solucões-ip-278/proteccão-perimetral-280/ds-2td2528t-3_q(c)-detail",
    "datasheetURL": null
  },
  {
    "model": "DS-2TD4137-25/WY(B)",
    "brand": "hikvision",
    "thermalRange": 175,
    "thermalVehicleRange": 525,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 384,
    "thermalResH": 288,
    "thermalFov": 14.9,
    "thermalVerticalFov": 11.2,
    "sourceURL": "https://www.visiotechsecurity.com/pt/produtos/cctv-ip-1/solucões-ip-278/proteccão-perimetral-280/ds-2td4137-25_wy(b)-detail",
    "datasheetURL": null
  },
  {
    "model": "DS-2TD4228T-10/S2",
    "brand": "hikvision",
    "thermalRange": 80,
    "thermalVehicleRange": 240,
    "thermalRangeBasis": "manufacturer-human-vca",
    "thermalVehicleRangeBasis": "manufacturer-vehicle-vca",
    "thermalResW": 256,
    "thermalResH": 192,
    "thermalFov": 18.1,
    "thermalVerticalFov": 13.6,
    "sourceURL": "https://www.visiotechsecurity.com/pt/produtos/cctv-ip-1/solucões-ip-278/proteccão-perimetral-280/ds-2td4228t-10_s2-detail",
    "datasheetURL": null
  }
];
const key=d=>String(d?.model||d?.reference||'').trim().toUpperCase().replace(/^UV-/,'');
const grouped=new Map();for(const patch of patches)grouped.set(key(patch),{...grouped.get(key(patch)),...patch});
const seeds=(root.CCTV_LIB||[]).filter(d=>!d.custom&&/^SF-IPTB/.test(d.model||'')).map(d=>({...d,...grouped.get(key(d)),id:d.id}));
function patchRows(lib){return (lib||[]).map(d=>d.custom?{...d}:{...d,...grouped.get(key(d)),id:d.id});}
function merge(lib){const out=patchRows(lib);for(const d of seeds)if(!out.some(x=>!x.custom&&key(x)===key(d)))out.push({...d});return out;}
for(const book of [root.SIGSThermalCatalog,root.SIGSHikvisionCCTV92,root.SIGSUniviewCCTV91]){
 if(!book)continue;
 book.rows=book===root.SIGSThermalCatalog?merge(book.rows):patchRows(book.rows);
 const previous=book.merge;if(previous)book.merge=lib=>merge(previous(lib));
 const lookup=book.lookup;if(lookup)book.lookup=d=>{const old=lookup(d);return old&&!d.custom?{...old,...grouped.get(key(d))}:old;};
}
root.CCTV_LIB=merge(root.CCTV_LIB);
if(root.SIGSThermalCatalog){root.SIGSThermalCatalog.analyticsStatusLabel=d=>d?.thermalAnalyticsStatus==='classification-not-documented'?'Termografia · classificação pessoas/carros não documentada':d?.thermalAnalyticsStatus==='available-range-unpublished'?'VCA: alcance não publicado':'VCA por confirmar';const previous=root.SIGSThermalCatalog.label;root.SIGSThermalCatalog.label=d=>d&&grouped.has(key(d))&&!d.custom?d.thermalResW+'×'+d.thermalResH+' nativo · térmica '+d.thermalLens+' mm · '+(d.thermalRangeBasis==='manufacturer-human-vca'?d.thermalRange+' m pessoas / '+d.thermalVehicleRange+' m carros · VCA':root.SIGSThermalCatalog.analyticsStatusLabel(d)):previous(d);}
root.SIGSThermalReview118={records,patches:grouped,key,merge};
if(typeof module!=='undefined'&&module.exports)module.exports=root.SIGSThermalReview118;
})(typeof window!=='undefined'?window:globalThis);
