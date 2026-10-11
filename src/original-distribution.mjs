/** Safe aggregate statistics from original APK, NEVER original board entries.
 * Recovered from ALL 93,457 BoardLib openings and at most 300 full largest-
 * group-policy simulations per tier in private original APK research.
 * Evidence: docs/CLASSIC_ORIGINAL_DISTRIBUTION_AUDIT.md;
 * Actions 38112163730 (APK SHA256 ef8048...).
 * p10/50/90 use sorted[floor(n*q)]. This is not live player success.
 */
export const ORIGINAL_LIBRARY_DISTRIBUTION = Object.freeze({
  "A": {
    "count": 1855,
    "opening": {
      "maxGroup": {
        "n": 1855,
        "mean": 8.588,
        "p10": 6,
        "p50": 8,
        "p90": 12,
        "min": 4,
        "max": 22,
        "stdev": 2.72
      },
      "removable": {
        "n": 1855,
        "mean": 64.453,
        "p10": 58,
        "p50": 65,
        "p90": 71,
        "min": 47,
        "max": 82,
        "stdev": 5.052
      },
      "isolated": {
        "n": 1855,
        "mean": 35.547,
        "p10": 29,
        "p50": 35,
        "p90": 42,
        "min": 18,
        "max": 53,
        "stdev": 5.052
      },
      "potential": {
        "n": 1855,
        "mean": 1330.345,
        "p10": 1005,
        "p50": 1285,
        "p90": 1720,
        "min": 760,
        "max": 2885,
        "stdev": 291.843
      },
      "groupCount": {
        "n": 1855,
        "mean": 20.92,
        "p10": 17,
        "p50": 21,
        "p90": 24,
        "min": 11,
        "max": 31,
        "stdev": 2.772
      }
    },
    "largestFirst": {
      "clearScore": {
        "n": 300,
        "mean": 1950.967,
        "p10": 1565,
        "p50": 1895,
        "p90": 2415,
        "min": 1310,
        "max": 3265,
        "stdev": 332.631
      },
      "remaining": {
        "n": 300,
        "mean": 11.56,
        "p10": 4,
        "p50": 11,
        "p90": 19,
        "min": 0,
        "max": 26,
        "stdev": 5.515
      },
      "bonus": {
        "n": 300,
        "mean": 437.2,
        "p10": 0,
        "p50": 0,
        "p90": 1680,
        "min": 0,
        "max": 2000,
        "stdev": 648.74
      },
      "totalScore": {
        "n": 300,
        "mean": 2388.167,
        "p10": 1615,
        "p50": 2140,
        "p90": 3595,
        "min": 1310,
        "max": 5085,
        "stdev": 772.086
      },
      "moves": {
        "n": 300,
        "mean": 25.857,
        "p10": 21,
        "p50": 26,
        "p90": 30,
        "min": 17,
        "max": 36,
        "stdev": 3.388
      }
    },
    "openingTailRates": {
      "maxGroup_ge10": 0.31159,
      "isolated_ge50": 0.00647,
      "isolated_ge60": 0,
      "noLegalGroups": 0
    },
    "jointHistogram3x10": {
      "max1:iso2": 11,
      "max1:iso3": 101,
      "max1:iso4": 34,
      "max2:iso2": 114,
      "max2:iso3": 633,
      "max2:iso4": 165,
      "max2:iso5": 7,
      "max3:iso1": 1,
      "max3:iso2": 60,
      "max3:iso3": 350,
      "max3:iso4": 117,
      "max3:iso5": 2,
      "max4:iso2": 14,
      "max4:iso3": 126,
      "max4:iso4": 47,
      "max4:iso5": 1,
      "max5:iso2": 1,
      "max5:iso3": 30,
      "max5:iso4": 25,
      "max5:iso5": 1,
      "max6:iso3": 8,
      "max6:iso4": 6,
      "max6:iso5": 1
    },
    "strategyTailRates": {
      "remaining_ge30": 0,
      "remaining_ge40": 0,
      "zeroBonus": 0.62333,
      "clearScore_ge2000": 0.38
    }
  },
  "B": {
    "count": 9858,
    "opening": {
      "maxGroup": {
        "n": 9858,
        "mean": 7.203,
        "p10": 5,
        "p50": 7,
        "p90": 10,
        "min": 3,
        "max": 21,
        "stdev": 2.171
      },
      "removable": {
        "n": 9858,
        "mean": 60.55,
        "p10": 54,
        "p50": 61,
        "p90": 67,
        "min": 37,
        "max": 78,
        "stdev": 5.235
      },
      "isolated": {
        "n": 9858,
        "mean": 39.45,
        "p10": 33,
        "p50": 39,
        "p90": 46,
        "min": 22,
        "max": 63,
        "stdev": 5.235
      },
      "potential": {
        "n": 9858,
        "mean": 1110.781,
        "p10": 850,
        "p50": 1075,
        "p90": 1410,
        "min": 510,
        "max": 2665,
        "stdev": 230.99
      },
      "groupCount": {
        "n": 9858,
        "mean": 20.751,
        "p10": 17,
        "p50": 21,
        "p90": 24,
        "min": 9,
        "max": 31,
        "stdev": 2.686
      }
    },
    "largestFirst": {
      "clearScore": {
        "n": 300,
        "mean": 1708.4,
        "p10": 1375,
        "p50": 1675,
        "p90": 2110,
        "min": 1150,
        "max": 2930,
        "stdev": 276.802
      },
      "remaining": {
        "n": 300,
        "mean": 13.387,
        "p10": 7,
        "p50": 13,
        "p90": 21,
        "min": 1,
        "max": 31,
        "stdev": 5.687
      },
      "bonus": {
        "n": 300,
        "mean": 263.933,
        "p10": 0,
        "p50": 0,
        "p90": 1020,
        "min": 0,
        "max": 1980,
        "stdev": 484.01
      },
      "totalScore": {
        "n": 300,
        "mean": 1972.333,
        "p10": 1385,
        "p50": 1775,
        "p90": 2820,
        "min": 1150,
        "max": 4105,
        "stdev": 587.612
      },
      "moves": {
        "n": 300,
        "mean": 26.75,
        "p10": 22,
        "p50": 27,
        "p90": 32,
        "min": 18,
        "max": 37,
        "stdev": 3.542
      }
    },
    "openingTailRates": {
      "maxGroup_ge10": 0.12974,
      "isolated_ge50": 0.02982,
      "isolated_ge60": 0.0002,
      "noLegalGroups": 0
    },
    "jointHistogram3x10": {
      "max1:iso2": 44,
      "max1:iso3": 928,
      "max1:iso4": 1017,
      "max1:iso5": 90,
      "max1:iso6": 1,
      "max2:iso2": 153,
      "max2:iso3": 2820,
      "max2:iso4": 2476,
      "max2:iso5": 127,
      "max2:iso6": 1,
      "max3:iso2": 37,
      "max3:iso3": 850,
      "max3:iso4": 791,
      "max3:iso5": 55,
      "max4:iso2": 2,
      "max4:iso3": 170,
      "max4:iso4": 207,
      "max4:iso5": 10,
      "max5:iso3": 17,
      "max5:iso4": 46,
      "max5:iso5": 8,
      "max6:iso3": 1,
      "max6:iso4": 5,
      "max6:iso5": 2
    },
    "strategyTailRates": {
      "remaining_ge30": 0.00667,
      "remaining_ge40": 0,
      "zeroBonus": 0.71,
      "clearScore_ge2000": 0.13667
    }
  },
  "C": {
    "count": 15153,
    "opening": {
      "maxGroup": {
        "n": 15153,
        "mean": 7.06,
        "p10": 5,
        "p50": 7,
        "p90": 10,
        "min": 3,
        "max": 18,
        "stdev": 1.993
      },
      "removable": {
        "n": 15153,
        "mean": 58.067,
        "p10": 51,
        "p50": 58,
        "p90": 65,
        "min": 34,
        "max": 77,
        "stdev": 5.335
      },
      "isolated": {
        "n": 15153,
        "mean": 41.933,
        "p10": 35,
        "p50": 42,
        "p90": 49,
        "min": 23,
        "max": 66,
        "stdev": 5.335
      },
      "potential": {
        "n": 15153,
        "mean": 1056.76,
        "p10": 815,
        "p50": 1030,
        "p90": 1335,
        "min": 455,
        "max": 2430,
        "stdev": 213.035
      },
      "groupCount": {
        "n": 15153,
        "mean": 19.915,
        "p10": 17,
        "p50": 20,
        "p90": 23,
        "min": 10,
        "max": 30,
        "stdev": 2.534
      }
    },
    "largestFirst": {
      "clearScore": {
        "n": 300,
        "mean": 1629.4,
        "p10": 1290,
        "p50": 1630,
        "p90": 1970,
        "min": 1050,
        "max": 2525,
        "stdev": 252.965
      },
      "remaining": {
        "n": 300,
        "mean": 16.113,
        "p10": 8,
        "p50": 16,
        "p90": 24,
        "min": 1,
        "max": 37,
        "stdev": 6.416
      },
      "bonus": {
        "n": 300,
        "mean": 153.067,
        "p10": 0,
        "p50": 0,
        "p90": 720,
        "min": 0,
        "max": 1980,
        "stdev": 425.488
      },
      "totalScore": {
        "n": 300,
        "mean": 1782.467,
        "p10": 1290,
        "p50": 1670,
        "p90": 2480,
        "min": 1050,
        "max": 3760,
        "stdev": 525.573
      },
      "moves": {
        "n": 300,
        "mean": 26.427,
        "p10": 22,
        "p50": 27,
        "p90": 31,
        "min": 17,
        "max": 36,
        "stdev": 3.776
      }
    },
    "openingTailRates": {
      "maxGroup_ge10": 0.1139,
      "isolated_ge50": 0.07913,
      "isolated_ge60": 0.00119,
      "noLegalGroups": 0
    },
    "jointHistogram3x10": {
      "max1:iso2": 22,
      "max1:iso3": 890,
      "max1:iso4": 2049,
      "max1:iso5": 355,
      "max1:iso6": 5,
      "max2:iso2": 67,
      "max2:iso3": 3046,
      "max2:iso4": 5070,
      "max2:iso5": 606,
      "max2:iso6": 8,
      "max3:iso2": 13,
      "max3:iso3": 846,
      "max3:iso4": 1505,
      "max3:iso5": 174,
      "max3:iso6": 4,
      "max4:iso2": 1,
      "max4:iso3": 112,
      "max4:iso4": 291,
      "max4:iso5": 42,
      "max4:iso6": 1,
      "max5:iso3": 14,
      "max5:iso4": 24,
      "max5:iso5": 4,
      "max6:iso4": 4
    },
    "strategyTailRates": {
      "remaining_ge30": 0.03,
      "remaining_ge40": 0,
      "zeroBonus": 0.85,
      "clearScore_ge2000": 0.07333
    }
  },
  "D": {
    "count": 33560,
    "opening": {
      "maxGroup": {
        "n": 33560,
        "mean": 6.381,
        "p10": 4,
        "p50": 6,
        "p90": 9,
        "min": 3,
        "max": 16,
        "stdev": 1.722
      },
      "removable": {
        "n": 33560,
        "mean": 55.115,
        "p10": 48,
        "p50": 55,
        "p90": 62,
        "min": 31,
        "max": 75,
        "stdev": 5.441
      },
      "isolated": {
        "n": 33560,
        "mean": 44.885,
        "p10": 38,
        "p50": 45,
        "p90": 52,
        "min": 25,
        "max": 69,
        "stdev": 5.441
      },
      "potential": {
        "n": 33560,
        "mean": 941.254,
        "p10": 720,
        "p50": 925,
        "p90": 1180,
        "min": 405,
        "max": 1965,
        "stdev": 183.384
      },
      "groupCount": {
        "n": 33560,
        "mean": 19.514,
        "p10": 16,
        "p50": 20,
        "p90": 23,
        "min": 9,
        "max": 29,
        "stdev": 2.517
      }
    },
    "largestFirst": {
      "clearScore": {
        "n": 300,
        "mean": 1505.167,
        "p10": 1235,
        "p50": 1495,
        "p90": 1815,
        "min": 905,
        "max": 2230,
        "stdev": 221.616
      },
      "remaining": {
        "n": 300,
        "mean": 17.627,
        "p10": 10,
        "p50": 17,
        "p90": 27,
        "min": 3,
        "max": 43,
        "stdev": 6.63
      },
      "bonus": {
        "n": 300,
        "mean": 91.667,
        "p10": 0,
        "p50": 0,
        "p90": 0,
        "min": 0,
        "max": 1820,
        "stdev": 321.718
      },
      "totalScore": {
        "n": 300,
        "mean": 1596.833,
        "p10": 1235,
        "p50": 1515,
        "p90": 1975,
        "min": 905,
        "max": 3675,
        "stdev": 397.301
      },
      "moves": {
        "n": 300,
        "mean": 26.96,
        "p10": 21,
        "p50": 27,
        "p90": 32,
        "min": 17,
        "max": 39,
        "stdev": 4.161
      }
    },
    "openingTailRates": {
      "maxGroup_ge10": 0.05608,
      "isolated_ge50": 0.19678,
      "isolated_ge60": 0.00474,
      "noLegalGroups": 0
    },
    "jointHistogram3x10": {
      "max1:iso2": 7,
      "max1:iso3": 1490,
      "max1:iso4": 7274,
      "max1:iso5": 2744,
      "max1:iso6": 89,
      "max2:iso2": 19,
      "max2:iso3": 3320,
      "max2:iso4": 11731,
      "max2:iso5": 3004,
      "max2:iso6": 57,
      "max3:iso2": 6,
      "max3:iso3": 549,
      "max3:iso4": 2301,
      "max3:iso5": 621,
      "max3:iso6": 11,
      "max4:iso2": 1,
      "max4:iso3": 37,
      "max4:iso4": 209,
      "max4:iso5": 73,
      "max4:iso6": 1,
      "max5:iso3": 2,
      "max5:iso4": 10,
      "max5:iso5": 3,
      "max5:iso6": 1
    },
    "strategyTailRates": {
      "remaining_ge30": 0.04,
      "remaining_ge40": 0.01,
      "zeroBonus": 0.91,
      "clearScore_ge2000": 0.01333
    }
  },
  "E": {
    "count": 25568,
    "opening": {
      "maxGroup": {
        "n": 25568,
        "mean": 5.821,
        "p10": 4,
        "p50": 6,
        "p90": 8,
        "min": 2,
        "max": 14,
        "stdev": 1.421
      },
      "removable": {
        "n": 25568,
        "mean": 51.657,
        "p10": 45,
        "p50": 52,
        "p90": 58,
        "min": 29,
        "max": 73,
        "stdev": 5.406
      },
      "isolated": {
        "n": 25568,
        "mean": 48.343,
        "p10": 42,
        "p50": 48,
        "p90": 55,
        "min": 27,
        "max": 71,
        "stdev": 5.406
      },
      "potential": {
        "n": 25568,
        "mean": 834.926,
        "p10": 650,
        "p50": 825,
        "p90": 1030,
        "min": 370,
        "max": 1580,
        "stdev": 148.498
      },
      "groupCount": {
        "n": 25568,
        "mean": 18.8,
        "p10": 16,
        "p50": 19,
        "p90": 22,
        "min": 9,
        "max": 29,
        "stdev": 2.479
      }
    },
    "largestFirst": {
      "clearScore": {
        "n": 300,
        "mean": 1357.883,
        "p10": 1125,
        "p50": 1335,
        "p90": 1590,
        "min": 890,
        "max": 2120,
        "stdev": 190.217
      },
      "remaining": {
        "n": 300,
        "mean": 22.51,
        "p10": 13,
        "p50": 23,
        "p90": 32,
        "min": 2,
        "max": 43,
        "stdev": 7.186
      },
      "bonus": {
        "n": 300,
        "mean": 43.067,
        "p10": 0,
        "p50": 0,
        "p90": 0,
        "min": 0,
        "max": 1920,
        "stdev": 223.03
      },
      "totalScore": {
        "n": 300,
        "mean": 1400.95,
        "p10": 1125,
        "p50": 1340,
        "p90": 1660,
        "min": 890,
        "max": 3815,
        "stdev": 317.772
      },
      "moves": {
        "n": 300,
        "mean": 25.98,
        "p10": 22,
        "p50": 26,
        "p90": 31,
        "min": 15,
        "max": 38,
        "stdev": 3.846
      }
    },
    "openingTailRates": {
      "maxGroup_ge10": 0.01639,
      "isolated_ge50": 0.40605,
      "isolated_ge60": 0.02175,
      "noLegalGroups": 0
    },
    "jointHistogram3x10": {
      "max0:iso5": 1,
      "max1:iso2": 2,
      "max1:iso3": 495,
      "max1:iso4": 6208,
      "max1:iso5": 4936,
      "max1:iso6": 331,
      "max1:iso7": 2,
      "max2:iso2": 1,
      "max2:iso3": 675,
      "max2:iso4": 7120,
      "max2:iso5": 4407,
      "max2:iso6": 180,
      "max2:iso7": 1,
      "max3:iso3": 35,
      "max3:iso4": 632,
      "max3:iso5": 458,
      "max3:iso6": 40,
      "max4:iso4": 18,
      "max4:iso5": 24,
      "max4:iso6": 2
    },
    "strategyTailRates": {
      "remaining_ge30": 0.15,
      "remaining_ge40": 0.00667,
      "zeroBonus": 0.95,
      "clearScore_ge2000": 0.01
    }
  },
  "F": {
    "count": 3460,
    "opening": {
      "maxGroup": {
        "n": 3460,
        "mean": 5.002,
        "p10": 4,
        "p50": 5,
        "p90": 6,
        "min": 3,
        "max": 10,
        "stdev": 1.095
      },
      "removable": {
        "n": 3460,
        "mean": 45.939,
        "p10": 39,
        "p50": 46,
        "p90": 53,
        "min": 27,
        "max": 62,
        "stdev": 5.276
      },
      "isolated": {
        "n": 3460,
        "mean": 54.061,
        "p10": 48,
        "p50": 54,
        "p90": 61,
        "min": 38,
        "max": 73,
        "stdev": 5.276
      },
      "potential": {
        "n": 3460,
        "mean": 677.319,
        "p10": 535,
        "p50": 675,
        "p90": 820,
        "min": 350,
        "max": 1130,
        "stdev": 111.033
      },
      "groupCount": {
        "n": 3460,
        "mean": 17.635,
        "p10": 15,
        "p50": 18,
        "p90": 21,
        "min": 10,
        "max": 26,
        "stdev": 2.413
      }
    },
    "largestFirst": {
      "clearScore": {
        "n": 300,
        "mean": 1124.05,
        "p10": 950,
        "p50": 1110,
        "p90": 1335,
        "min": 695,
        "max": 1645,
        "stdev": 151.996
      },
      "remaining": {
        "n": 300,
        "mean": 28.197,
        "p10": 18,
        "p50": 28,
        "p90": 38,
        "min": 9,
        "max": 53,
        "stdev": 7.447
      },
      "bonus": {
        "n": 300,
        "mean": 2.533,
        "p10": 0,
        "p50": 0,
        "p90": 0,
        "min": 0,
        "max": 380,
        "stdev": 30.923
      },
      "totalScore": {
        "n": 300,
        "mean": 1126.583,
        "p10": 950,
        "p50": 1110,
        "p90": 1335,
        "min": 695,
        "max": 1785,
        "stdev": 157.877
      },
      "moves": {
        "n": 300,
        "mean": 25.9,
        "p10": 21,
        "p50": 26,
        "p90": 31,
        "min": 17,
        "max": 38,
        "stdev": 3.635
      }
    },
    "openingTailRates": {
      "maxGroup_ge10": 0.00116,
      "isolated_ge50": 0.80491,
      "isolated_ge60": 0.1474,
      "noLegalGroups": 0
    },
    "jointHistogram3x10": {
      "max1:iso3": 3,
      "max1:iso4": 475,
      "max1:iso5": 1659,
      "max1:iso6": 374,
      "max1:iso7": 6,
      "max2:iso3": 2,
      "max2:iso4": 190,
      "max2:iso5": 601,
      "max2:iso6": 121,
      "max3:iso4": 5,
      "max3:iso5": 15,
      "max3:iso6": 9
    },
    "strategyTailRates": {
      "remaining_ge30": 0.43333,
      "remaining_ge40": 0.05667,
      "zeroBonus": 0.99333,
      "clearScore_ge2000": 0
    }
  },
  "G": {
    "count": 3887,
    "opening": {
      "maxGroup": {
        "n": 3887,
        "mean": 5.523,
        "p10": 4,
        "p50": 5,
        "p90": 7,
        "min": 3,
        "max": 11,
        "stdev": 1.221
      },
      "removable": {
        "n": 3887,
        "mean": 56.97,
        "p10": 50,
        "p50": 57,
        "p90": 64,
        "min": 35,
        "max": 73,
        "stdev": 5.433
      },
      "isolated": {
        "n": 3887,
        "mean": 43.03,
        "p10": 36,
        "p50": 43,
        "p90": 50,
        "min": 27,
        "max": 65,
        "stdev": 5.433
      },
      "potential": {
        "n": 3887,
        "mean": 878.667,
        "p10": 705,
        "p50": 875,
        "p90": 1060,
        "min": 455,
        "max": 1385,
        "stdev": 136.18
      },
      "groupCount": {
        "n": 3887,
        "mean": 21.267,
        "p10": 18,
        "p50": 21,
        "p90": 24,
        "min": 12,
        "max": 29,
        "stdev": 2.436
      }
    },
    "largestFirst": {
      "clearScore": {
        "n": 300,
        "mean": 1484.767,
        "p10": 1265,
        "p50": 1480,
        "p90": 1720,
        "min": 945,
        "max": 2145,
        "stdev": 184.696
      },
      "remaining": {
        "n": 300,
        "mean": 13.447,
        "p10": 6,
        "p50": 13,
        "p90": 21,
        "min": 1,
        "max": 41,
        "stdev": 6.156
      },
      "bonus": {
        "n": 300,
        "mean": 317.8,
        "p10": 0,
        "p50": 0,
        "p90": 1280,
        "min": 0,
        "max": 1980,
        "stdev": 557.156
      },
      "totalScore": {
        "n": 300,
        "mean": 1802.567,
        "p10": 1265,
        "p50": 1535,
        "p90": 2870,
        "min": 945,
        "max": 3810,
        "stdev": 637.954
      },
      "moves": {
        "n": 300,
        "mean": 28.963,
        "p10": 24,
        "p50": 29,
        "p90": 33,
        "min": 19,
        "max": 39,
        "stdev": 3.653
      }
    },
    "openingTailRates": {
      "maxGroup_ge10": 0.00515,
      "isolated_ge50": 0.11526,
      "isolated_ge60": 0.0018,
      "noLegalGroups": 0
    },
    "jointHistogram3x10": {
      "max1:iso2": 4,
      "max1:iso3": 510,
      "max1:iso4": 1335,
      "max1:iso5": 266,
      "max1:iso6": 7,
      "max2:iso2": 8,
      "max2:iso3": 500,
      "max2:iso4": 1007,
      "max2:iso5": 167,
      "max3:iso3": 25,
      "max3:iso4": 50,
      "max3:iso5": 8
    },
    "strategyTailRates": {
      "remaining_ge30": 0.01333,
      "remaining_ge40": 0.00333,
      "zeroBonus": 0.7,
      "clearScore_ge2000": 0.01
    }
  },
  "H": {
    "count": 73,
    "opening": {
      "maxGroup": {
        "n": 73,
        "mean": 4.329,
        "p10": 3,
        "p50": 4,
        "p90": 5,
        "min": 3,
        "max": 8,
        "stdev": 0.994
      },
      "removable": {
        "n": 73,
        "mean": 39.836,
        "p10": 33,
        "p50": 39,
        "p90": 47,
        "min": 28,
        "max": 51,
        "stdev": 5.361
      },
      "isolated": {
        "n": 73,
        "mean": 60.164,
        "p10": 53,
        "p50": 61,
        "p90": 67,
        "min": 49,
        "max": 72,
        "stdev": 5.361
      },
      "potential": {
        "n": 73,
        "mean": 547.123,
        "p10": 420,
        "p50": 545,
        "p90": 665,
        "min": 330,
        "max": 825,
        "stdev": 101.184
      },
      "groupCount": {
        "n": 73,
        "mean": 16.014,
        "p10": 13,
        "p50": 16,
        "p90": 20,
        "min": 10,
        "max": 23,
        "stdev": 2.524
      }
    },
    "largestFirst": {
      "clearScore": {
        "n": 73,
        "mean": 944.589,
        "p10": 745,
        "p50": 965,
        "p90": 1125,
        "min": 470,
        "max": 1305,
        "stdev": 167.993
      },
      "remaining": {
        "n": 73,
        "mean": 35.603,
        "p10": 24,
        "p50": 35,
        "p90": 48,
        "min": 13,
        "max": 62,
        "stdev": 9.788
      },
      "bonus": {
        "n": 73,
        "mean": 0,
        "p10": 0,
        "p50": 0,
        "p90": 0,
        "min": 0,
        "max": 0,
        "stdev": 0
      },
      "totalScore": {
        "n": 73,
        "mean": 944.589,
        "p10": 745,
        "p50": 965,
        "p90": 1125,
        "min": 470,
        "max": 1305,
        "stdev": 167.993
      },
      "moves": {
        "n": 73,
        "mean": 24.438,
        "p10": 18,
        "p50": 25,
        "p90": 30,
        "min": 14,
        "max": 36,
        "stdev": 4.557
      }
    },
    "openingTailRates": {
      "maxGroup_ge10": 0,
      "isolated_ge50": 0.9863,
      "isolated_ge60": 0.56164,
      "noLegalGroups": 0
    },
    "jointHistogram3x10": {
      "max1:iso4": 1,
      "max1:iso5": 29,
      "max1:iso6": 34,
      "max1:iso7": 3,
      "max2:iso5": 2,
      "max2:iso6": 4
    },
    "strategyTailRates": {
      "remaining_ge30": 0.72603,
      "remaining_ge40": 0.36986,
      "zeroBonus": 1,
      "clearScore_ge2000": 0
    }
  },
  "I": {
    "count": 43,
    "opening": {
      "maxGroup": {
        "n": 43,
        "mean": 11.302,
        "p10": 7,
        "p50": 11,
        "p90": 17,
        "min": 6,
        "max": 20,
        "stdev": 3.849
      },
      "removable": {
        "n": 43,
        "mean": 68.14,
        "p10": 62,
        "p50": 68,
        "p90": 74,
        "min": 61,
        "max": 77,
        "stdev": 4.391
      },
      "isolated": {
        "n": 43,
        "mean": 31.86,
        "p10": 26,
        "p50": 32,
        "p90": 38,
        "min": 23,
        "max": 39,
        "stdev": 4.391
      },
      "potential": {
        "n": 43,
        "mean": 1693.488,
        "p10": 1285,
        "p50": 1540,
        "p90": 2455,
        "min": 1055,
        "max": 2990,
        "stdev": 438.606
      },
      "groupCount": {
        "n": 43,
        "mean": 20.767,
        "p10": 17,
        "p50": 20,
        "p90": 25,
        "min": 14,
        "max": 28,
        "stdev": 3.139
      }
    },
    "largestFirst": {
      "clearScore": {
        "n": 43,
        "mean": 2315.814,
        "p10": 1795,
        "p50": 2200,
        "p90": 2890,
        "min": 1615,
        "max": 3430,
        "stdev": 441.036
      },
      "remaining": {
        "n": 43,
        "mean": 10.558,
        "p10": 5,
        "p50": 10,
        "p90": 16,
        "min": 0,
        "max": 26,
        "stdev": 4.952
      },
      "bonus": {
        "n": 43,
        "mean": 497.209,
        "p10": 0,
        "p50": 0,
        "p90": 1500,
        "min": 0,
        "max": 2000,
        "stdev": 634.535
      },
      "totalScore": {
        "n": 43,
        "mean": 2813.023,
        "p10": 1930,
        "p50": 2765,
        "p90": 3850,
        "min": 1620,
        "max": 4340,
        "stdev": 720.854
      },
      "moves": {
        "n": 43,
        "mean": 24.023,
        "p10": 20,
        "p50": 24,
        "p90": 29,
        "min": 16,
        "max": 31,
        "stdev": 3.54
      }
    },
    "openingTailRates": {
      "maxGroup_ge10": 0.65116,
      "isolated_ge50": 0,
      "isolated_ge60": 0,
      "noLegalGroups": 0
    },
    "jointHistogram3x10": {
      "max2:iso2": 6,
      "max2:iso3": 6,
      "max3:iso2": 4,
      "max3:iso3": 9,
      "max4:iso2": 1,
      "max4:iso3": 7,
      "max5:iso2": 1,
      "max5:iso3": 5,
      "max6:iso3": 4
    },
    "strategyTailRates": {
      "remaining_ge30": 0,
      "remaining_ge40": 0,
      "zeroBonus": 0.51163,
      "clearScore_ge2000": 0.76744
    }
  }
});

/** Five-knot quantile approximation of an original source tier's marginal.
 * We use only population aggregates, no copyrighted library records. */
export function sourceQuantile(stats,q){
  if(!stats || !Number.isFinite(q))throw new Error('Invalid source reference quantile');
  const bounded=Math.max(0,Math.min(1,q));
  const keys=[[0,stats.min],[0.1,stats.p10],[0.5,stats.p50],[0.9,stats.p90],[1,stats.max]];
  for(let i=1;i<keys.length;i++){
    if(bounded<=keys[i][0]){
      const [x0,y0]=keys[i-1],[x1,y1]=keys[i];
      return y0+(y1-y0)*(bounded-x0)/(x1-x0);
    }
  }
  return stats.max;
}
