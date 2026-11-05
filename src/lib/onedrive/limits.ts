/**
 * Control limits per tool and analysis series id (see analysis.json).
 * Hardcoded for now; OVL, DEF52 and MTH53 bands are the current data range ±20% of that range (±20% of the value when there is a single point); seeded from the old TIE Metro SPC Trend Monitor bands. Moves to a database later.
 */
export type Limit = { upper?: number; lower?: number }

export const LIMITS: Record<string, Record<string, Limit>> = {
	AOI52: {
		total: {
			upper: 74.31459081286505,
			lower: 69.13995464168042
		}
	},
	DEF51: {
		'HT:DW Oblique Defects Totals:Sum Of All Count(Defects)': {
			upper: 11329.378704993982,
			lower: 8807.139813524536
		},
		'ST:DW Oblique Defects Totals:Sum Of All Count(Defects)': {
			upper: 13847.997484610107,
			lower: 9878.891404278784
		},
		'HS:DW Oblique Defects Totals:Sum Of All Count(Defects)': {
			upper: 16701.897839460078,
			lower: 11263.28734572511
		},
		'UHS:DW Oblique Defects Totals:Sum Of All Count(Defects)': {
			upper: 20052.568505524956,
			lower: 12677.283346326894
		},
		'HT:DW Oblique Defects Totals:LPD Size Peak': {
			upper: 0.06113578494196299,
			lower: 0.05929694233076421
		},
		'ST:DW Oblique Defects Totals:LPD Size Peak': {
			upper: 0.06112317196233745,
			lower: 0.05933197955281415
		},
		'HS:DW Oblique Defects Totals:LPD Size Peak': {
			upper: 0.061671957029642434,
			lower: 0.05910739780906716
		},
		'UHS:DW Oblique Defects Totals:LPD Size Peak': {
			upper: 0.061101750551958975,
			lower: 0.05964387444804102
		}
	},
	MTH52: {
		'30Å_Oxide_SE:1st Thickness:MEAN': {
			upper: 37.98676086956522,
			lower: 36.41264782608695
		},
		'30Å_Oxide_SE:1st Thickness:RANGE': {
			upper: 1.6398347826086956,
			lower: 0.06572173913043478
		},
		'30Å_Oxide_SE:GOF:MEAN': {
			upper: 2.300176,
			lower: -0.316928
		},
		'60Å_Oxide_SE:1st Thickness:MEAN': {
			upper: 67.94833043478262,
			lower: 66.2204
		},
		'60Å_Oxide_SE:1st Thickness:RANGE': {
			upper: 1.8303260869565219,
			lower: 0.102395652173913
		},
		'60Å_Oxide_SE:GOF:MEAN': {
			upper: 2.1107692307692307,
			lower: -0.12782307692307693
		},
		'120Å_Oxide_SE:1st Thickness:MEAN': {
			upper: 131.05415217391305,
			lower: 129.6291956521739
		},
		'120Å_Oxide_SE:1st Thickness:RANGE': {
			upper: 1.3531826086956522,
			lower: -0.07177391304347824
		},
		'120Å_Oxide_SE:GOF:MEAN': {
			upper: 2.0253846153846156,
			lower: -0.04259230769230771
		},
		'500Å_Oxide_15XDBS:1st Thickness:MEAN': {
			upper: 509.8841961538461,
			lower: 492.27765
		},
		'500Å_Oxide_15XDBS:1st Thickness:RANGE': {
			upper: 18.557023076923077,
			lower: 0.9504769230769234
		},
		'500Å_Oxide_15XDBS:GOF:MEAN': {
			upper: 9.79578846153846,
			lower: -7.810757692307692
		},
		'500Å_Oxide_1XDBS:1st Thickness:MEAN': {
			upper: 510.14363076923075,
			lower: 492.76036153846155
		},
		'500Å_Oxide_1XDBS:1st Thickness:RANGE': {
			upper: 18.348884615384613,
			lower: 0.9656153846153845
		},
		'500Å_Oxide_1XDBS:GOF:MEAN': {
			upper: 9.67893076923077,
			lower: -7.704338461538461
		},
		'500Å_Oxide_SE:1st Thickness:MEAN': {
			upper: 508.988612,
			lower: 491.9497
		},
		'500Å_Oxide_SE:1st Thickness:RANGE': {
			upper: 17.99478076923077,
			lower: 0.8737576923076915
		},
		'500Å_Oxide_SE:GOF:MEAN': {
			upper: 9.552807692307692,
			lower: -7.568215384615384
		},
		'9000Å_Oxide_15XDBS_VIS:1st Thickness:MEAN': {
			upper: 9138.988665384615,
			lower: 9050.081403846154
		},
		'9000Å_Oxide_15XDBS_VIS:1st Thickness:RANGE': {
			upper: 90.38617692307693,
			lower: 1.4789153846153837
		},
		'9000Å_Oxide_15XDBS_VIS:GOF:MEAN': {
			upper: 45.445934615384616,
			lower: -43.461326923076925
		},
		'9000Å_Oxide_1XDBS_VIS:1st Thickness:MEAN': {
			upper: 9140.365373076922,
			lower: 9050.783688461539
		},
		'9000Å_Oxide_1XDBS_VIS:1st Thickness:RANGE': {
			upper: 90.96718461538461,
			lower: 1.3855000000000004
		},
		'9000Å_Oxide_1XDBS_VIS:GOF:MEAN': {
			upper: 45.77999230769231,
			lower: -43.801692307692306
		},
		'9000Å_Oxide_SE_OSC:1st Thickness:MEAN': {
			upper: 9138.211704347827,
			lower: 9048.183852173914
		},
		'9000Å_Oxide_SE_OSC:1st Thickness:RANGE': {
			upper: 91.5747,
			lower: 1.1013923076923149
		},
		'9000Å_Oxide_SE_OSC:GOF:MEAN': {
			upper: 46.21045769230769,
			lower: -44.26284999999999
		},
		'Nitride_T_N_SE:1st Thickness:MEAN': {
			upper: 686.0352653846154,
			lower: 637.2124884615386
		},
		'Nitride_T_N_SE:1st Thickness:RANGE': {
			upper: 51.02450384615385,
			lower: 2.2017269230769223
		},
		'Nitride_T_N_SE:GOF:MEAN': {
			upper: 25.39315,
			lower: -23.429626923076924
		},
		'AlCu Refl @ 248-750nm - 15X:Reflectivity:MEAN': {
			upper: 0.193636,
			lower: 0.190812
		},
		'AlCu Refl @ 248-750nm - 15X:Reflectivity:RANGE': {
			upper: 0.002908,
			lower: 0.00008399999999999987
		},
		'OPO_SE:3rd Thickness:MEAN': {
			upper: 249.55030869565218,
			lower: 247.55848260869567
		},
		'OPO_SE:3rd Thickness:RANGE': {
			upper: 2.026691304347826,
			lower: 0.034865217391304326
		},
		'OPO_SE:GOF:MEAN': {
			upper: 4.322107692307692,
			lower: -2.3500615384615386
		},
		'OPO_SE:2nd Thickness:MEAN': {
			upper: 2011.3667391304348,
			lower: 2005.7749739130436
		},
		'OPO_SE:2nd Thickness:RANGE': {
			upper: 5.4020913043478265,
			lower: -0.18967391304347814
		},
		'OPO_SE:2nd RI @ 633.0nm:MEAN': {
			upper: 3.8553208333333333,
			lower: 3.8521875
		},
		'OPO_SE:2nd RI @ 633.0nm:RANGE': {
			upper: 0.002147826086956522,
			lower: 0.000017391304347826085
		},
		'OPO_SE_FLOAT:3rd Thickness:MEAN': {
			upper: 249.5758652173913,
			lower: 247.5722652173913
		},
		'OPO_SE_FLOAT:3rd Thickness:RANGE': {
			upper: 2.033186956521739,
			lower: 0.02958695652173904
		},
		'OPO_SE_FLOAT:GOF:MEAN': {
			upper: 11.257850000000001,
			lower: -9.282242307692307
		},
		'OPO_SE_FLOAT:2nd Thickness:MEAN': {
			upper: 2011.9524304347826,
			lower: 2006.729647826087
		},
		'OPO_SE_FLOAT:2nd Thickness:RANGE': {
			upper: 5.020091304347826,
			lower: -0.20269130434782623
		},
		'OPO_SE_FLOAT:2nd RI @ 633.0nm:MEAN': {
			upper: 3.855608695652174,
			lower: 3.853678260869565
		},
		'OPO_SE_FLOAT:2nd RI @ 633.0nm:RANGE': {
			upper: 0.001969565217391304,
			lower: 0.00003913043478260864
		},
		'OPO_SE_FLOAT:1st Thickness:MEAN': {
			upper: 993.032652173913,
			lower: 983.6701304347825
		},
		'OPO_SE_FLOAT:1st Thickness:RANGE': {
			upper: 9.535665217391305,
			lower: 0.17314347826086962
		},
		'OPO_SE_FLOAT_T_N:3rd Thickness:MEAN': {
			upper: 249.62779999999998,
			lower: 247.5942
		},
		'OPO_SE_FLOAT_T_N:3rd Thickness:RANGE': {
			upper: 2.1134,
			lower: 0.0798000000000001
		},
		'OPO_SE_FLOAT_T_N:GOF:MEAN': {
			upper: 5.3671999999999995,
			lower: -3.389666666666666
		},
		'OPO_SE_FLOAT_T_N:2nd Thickness:MEAN': {
			upper: 2011.6652666666666,
			lower: 2006.4184666666667
		},
		'OPO_SE_FLOAT_T_N:2nd Thickness:RANGE': {
			upper: 5.0933,
			lower: -0.1535000000000002
		},
		'OPO_SE_FLOAT_T_N:2nd RI @ 633.0nm:MEAN': {
			upper: 3.856066666666667,
			lower: 3.8542666666666667
		},
		'OPO_SE_FLOAT_T_N:2nd RI @ 633.0nm:RANGE': {
			upper: 0.0017666666666666666,
			lower: -0.00003333333333333335
		},
		'OPO_SE_FLOAT_T_N:1st Thickness:MEAN': {
			upper: 992.9538,
			lower: 984.1969333333334
		},
		'OPO_SE_FLOAT_T_N:1st Thickness:RANGE': {
			upper: 8.565633333333333,
			lower: -0.19123333333333292
		},
		'AlCu Refl @ 248-750nm - 1X:Reflectivity:MEAN': {
			upper: 0.9031,
			lower: 0.895976923076923
		},
		'AlCu Refl @ 248-750nm - 1X:Reflectivity:RANGE': {
			upper: 0.007346153846153846,
			lower: 0.00022307692307692306
		}
	},
	OVL51: {
		'TN1:MisX:mean': {
			upper: -66.6925,
			lower: -100.039
		},
		'TN1:MisX:3s': {
			upper: 666.836,
			lower: 444.558
		},
		'TN1:MisX:max': {
			upper: 969.732,
			lower: 646.488
		},
		'TN1:MisX:m3s': {
			upper: 766.875,
			lower: 511.25
		},
		'TN1:MisY:mean': {
			upper: -55.7343,
			lower: -83.6014
		},
		'TN1:MisY:3s': {
			upper: 647.727,
			lower: 431.818
		},
		'TN1:MisY:max': {
			upper: 987.084,
			lower: 658.056
		},
		'TN1:MisY:m3s': {
			upper: 731.328,
			lower: 487.552
		},
		'TN1:TISX:mean': {
			upper: -1.98366,
			lower: -2.97549
		},
		'TN1:TISX:3s': {
			upper: 14.3927,
			lower: 9.59512
		},
		'TN1:TISX:max': {
			upper: 15.408,
			lower: 10.272
		},
		'TN1:TISX:m3s': {
			upper: 17.3682,
			lower: 11.5788
		},
		'TN1:TISY:mean': {
			upper: -0.463276,
			lower: -0.694914
		},
		'TN1:TISY:3s': {
			upper: 13.0951,
			lower: 8.73009
		},
		'TN1:TISY:max': {
			upper: 16.224,
			lower: 10.816
		},
		'TN1:TISY:m3s': {
			upper: 13.7901,
			lower: 9.19337
		},
		'TN1:sites': {
			upper: 252,
			lower: 168
		},
		'TN2:MisX:mean': {
			upper: -56.4925,
			lower: -84.7387
		},
		'TN2:MisX:3s': {
			upper: 403.264,
			lower: 268.843
		},
		'TN2:MisX:max': {
			upper: 574.092,
			lower: 382.728
		},
		'TN2:MisX:m3s': {
			upper: 488.003,
			lower: 325.335
		},
		'TN2:MisY:mean': {
			upper: 62.4071,
			lower: 41.6047
		},
		'TN2:MisY:3s': {
			upper: 635.942,
			lower: 423.961
		},
		'TN2:MisY:max': {
			upper: 842.556,
			lower: 561.704
		},
		'TN2:MisY:m3s': {
			upper: 698.349,
			lower: 465.566
		},
		'TN2:TISX:mean': {
			upper: -2.08964,
			lower: -3.13446
		},
		'TN2:TISX:3s': {
			upper: 14.3899,
			lower: 9.59326
		},
		'TN2:TISX:max': {
			upper: 26.664,
			lower: 17.776
		},
		'TN2:TISX:m3s': {
			upper: 17.5243,
			lower: 11.6829
		},
		'TN2:TISY:mean': {
			upper: -0.993524,
			lower: -1.49029
		},
		'TN2:TISY:3s': {
			upper: 14.0311,
			lower: 9.35409
		},
		'TN2:TISY:max': {
			upper: 13.548,
			lower: 9.032
		},
		'TN2:TISY:m3s': {
			upper: 15.5214,
			lower: 10.3476
		},
		'TN2:sites': {
			upper: 252,
			lower: 168
		},
		'TN3:MisX:mean': {
			upper: 192.928,
			lower: 128.618
		},
		'TN3:MisX:3s': {
			upper: 433.25,
			lower: 288.833
		},
		'TN3:MisX:max': {
			upper: 530.016,
			lower: 353.344
		},
		'TN3:MisX:m3s': {
			upper: 626.177,
			lower: 417.451
		},
		'TN3:MisY:mean': {
			upper: 149.288,
			lower: 99.5254
		},
		'TN3:MisY:3s': {
			upper: 425.876,
			lower: 283.917
		},
		'TN3:MisY:max': {
			upper: 971.616,
			lower: 647.744
		},
		'TN3:MisY:m3s': {
			upper: 575.164,
			lower: 383.443
		},
		'TN3:TISX:mean': {
			upper: -1.34719,
			lower: -2.02079
		},
		'TN3:TISX:3s': {
			upper: 13.8579,
			lower: 9.23859
		},
		'TN3:TISX:max': {
			upper: 12.444,
			lower: 8.296
		},
		'TN3:TISX:m3s': {
			upper: 15.8787,
			lower: 10.5858
		},
		'TN3:TISY:mean': {
			upper: -1.17782,
			lower: -1.76673
		},
		'TN3:TISY:3s': {
			upper: 35.9977,
			lower: 23.9985
		},
		'TN3:TISY:max': {
			upper: 141.996,
			lower: 94.664
		},
		'TN3:TISY:m3s': {
			upper: 37.7645,
			lower: 25.1763
		},
		'TN3:sites': {
			upper: 237.6,
			lower: 158.4
		}
	},
	OVL52: {
		'TN1:MisX:mean': {
			upper: 8.12836,
			lower: 5.41891
		},
		'TN1:MisX:3s': {
			upper: 11.9923,
			lower: 7.99486
		},
		'TN1:MisX:max': {
			upper: 14.7,
			lower: 9.8
		},
		'TN1:MisX:m3s': {
			upper: 20.1206,
			lower: 13.4138
		},
		'TN1:MisY:mean': {
			upper: 3.54,
			lower: 2.36
		},
		'TN1:MisY:3s': {
			upper: 6.07744,
			lower: 4.05162
		},
		'TN1:MisY:max': {
			upper: 6.048,
			lower: 4.032
		},
		'TN1:MisY:m3s': {
			upper: 9.61744,
			lower: 6.41162
		},
		'TN1:TISX:mean': {
			upper: 0.3984,
			lower: 0.2656
		},
		'TN1:TISX:3s': {
			upper: 0.50079,
			lower: 0.33386
		},
		'TN1:TISX:max': {
			upper: 0.648,
			lower: 0.432
		},
		'TN1:TISX:m3s': {
			upper: 0.89919,
			lower: 0.59946
		},
		'TN1:TISY:mean': {
			upper: -0.3992,
			lower: -0.5988
		},
		'TN1:TISY:3s': {
			upper: 0.567551,
			lower: 0.378367
		},
		'TN1:TISY:max': {
			upper: 0.828,
			lower: 0.552
		},
		'TN1:TISY:m3s': {
			upper: 1.16635,
			lower: 0.777567
		},
		'TN1:MregX:mean': {
			upper: 0.4008,
			lower: 0.2672
		},
		'TN1:MregX:3s': {
			upper: 27.8944,
			lower: 18.5963
		},
		'TN1:MregX:max': {
			upper: 14.7,
			lower: 9.8
		},
		'TN1:MregX:m3s': {
			upper: 28.2952,
			lower: 18.8635
		},
		'TN1:MregY:mean': {
			upper: -0.398,
			lower: -0.597
		},
		'TN1:MregY:3s': {
			upper: 14.6856,
			lower: 9.79037
		},
		'TN1:MregY:max': {
			upper: 7.452,
			lower: 4.968
		},
		'TN1:MregY:m3s': {
			upper: 15.2826,
			lower: 10.1884
		},
		'TN1:pass': {
			upper: 120,
			lower: 80
		},
		'TN1:sites': {
			upper: 24,
			lower: 16
		},
		'TN2:MregX:mean': {
			upper: 0,
			lower: 0
		},
		'TN2:MregX:3s': {
			upper: 0,
			lower: 0
		},
		'TN2:MregX:max': {
			upper: 0,
			lower: 0
		},
		'TN2:MregX:m3s': {
			upper: 0,
			lower: 0
		},
		'TN2:MregY:mean': {
			upper: 0,
			lower: 0
		},
		'TN2:MregY:3s': {
			upper: 0,
			lower: 0
		},
		'TN2:MregY:max': {
			upper: 0,
			lower: 0
		},
		'TN2:MregY:m3s': {
			upper: 0,
			lower: 0
		},
		'TN2:pass': {
			upper: 0,
			lower: 0
		},
		'TN2:sites': {
			upper: 24,
			lower: 16
		},
		'TN3:MisX:mean': {
			upper: 8.868,
			lower: 5.912
		},
		'TN3:MisX:3s': {
			upper: 10.4596,
			lower: 6.97306
		},
		'TN3:MisX:max': {
			upper: 12.828,
			lower: 8.552
		},
		'TN3:MisX:m3s': {
			upper: 19.3276,
			lower: 12.8851
		},
		'TN3:MisY:mean': {
			upper: -1.32945,
			lower: -1.99418
		},
		'TN3:MisY:3s': {
			upper: 5.95688,
			lower: 3.97125
		},
		'TN3:MisY:max': {
			upper: 5.94,
			lower: 3.96
		},
		'TN3:MisY:m3s': {
			upper: 7.95106,
			lower: 5.30071
		},
		'TN3:TISX:mean': {
			upper: 0.3744,
			lower: 0.2496
		},
		'TN3:TISX:3s': {
			upper: 0.365084,
			lower: 0.243389
		},
		'TN3:TISX:max': {
			upper: 0.624,
			lower: 0.416
		},
		'TN3:TISX:m3s': {
			upper: 0.739484,
			lower: 0.492989
		},
		'TN3:TISY:mean': {
			upper: -0.3744,
			lower: -0.5616
		},
		'TN3:TISY:3s': {
			upper: 0.853739,
			lower: 0.569159
		},
		'TN3:TISY:max': {
			upper: 0.984,
			lower: 0.656
		},
		'TN3:TISY:m3s': {
			upper: 1.41534,
			lower: 0.943559
		},
		'TN3:MregX:mean': {
			upper: 0.375,
			lower: 0.25
		},
		'TN3:MregX:3s': {
			upper: 29.4664,
			lower: 19.6443
		},
		'TN3:MregX:max': {
			upper: 12.828,
			lower: 8.552
		},
		'TN3:MregX:m3s': {
			upper: 29.8414,
			lower: 19.8943
		},
		'TN3:MregY:mean': {
			upper: -0.3752,
			lower: -0.5628
		},
		'TN3:MregY:3s': {
			upper: 7.65756,
			lower: 5.10504
		},
		'TN3:MregY:max': {
			upper: 5.94,
			lower: 3.96
		},
		'TN3:MregY:m3s': {
			upper: 8.22036,
			lower: 5.48024
		},
		'TN3:pass': {
			upper: 120,
			lower: 80
		},
		'TN3:sites': {
			upper: 24,
			lower: 16
		},
		'TN4:MisX:mean': {
			upper: 4.6487,
			lower: 3.09913
		},
		'TN4:MisX:3s': {
			upper: 19.1882,
			lower: 12.7921
		},
		'TN4:MisX:max': {
			upper: 16.98,
			lower: 11.32
		},
		'TN4:MisX:m3s': {
			upper: 23.8369,
			lower: 15.8912
		},
		'TN4:MisY:mean': {
			upper: 0.186783,
			lower: 0.124522
		},
		'TN4:MisY:3s': {
			upper: 5.86483,
			lower: 3.90988
		},
		'TN4:MisY:max': {
			upper: 6.096,
			lower: 4.064
		},
		'TN4:MisY:m3s': {
			upper: 6.05161,
			lower: 4.03441
		},
		'TN4:TISX:mean': {
			upper: 0.3516,
			lower: 0.2344
		},
		'TN4:TISX:3s': {
			upper: 0.566179,
			lower: 0.377453
		},
		'TN4:TISX:max': {
			upper: 0.732,
			lower: 0.488
		},
		'TN4:TISX:m3s': {
			upper: 0.917779,
			lower: 0.611853
		},
		'TN4:TISY:mean': {
			upper: -0.3552,
			lower: -0.5328
		},
		'TN4:TISY:3s': {
			upper: 0.447457,
			lower: 0.298305
		},
		'TN4:TISY:max': {
			upper: 0.72,
			lower: 0.48
		},
		'TN4:TISY:m3s': {
			upper: 0.980257,
			lower: 0.653505
		},
		'TN4:MregX:mean': {
			upper: 0.3498,
			lower: 0.2332
		},
		'TN4:MregX:3s': {
			upper: 35.4727,
			lower: 23.6485
		},
		'TN4:MregX:max': {
			upper: 16.98,
			lower: 11.32
		},
		'TN4:MregX:m3s': {
			upper: 35.8225,
			lower: 23.8817
		},
		'TN4:MregY:mean': {
			upper: -0.3564,
			lower: -0.5346
		},
		'TN4:MregY:3s': {
			upper: 9.53139,
			lower: 6.35426
		},
		'TN4:MregY:max': {
			upper: 7.38,
			lower: 4.92
		},
		'TN4:MregY:m3s': {
			upper: 10.066,
			lower: 6.71066
		},
		'TN4:pass': {
			upper: 104.348,
			lower: 69.5652
		},
		'TN4:sites': {
			upper: 27.6,
			lower: 18.4
		}
	},
	DEF52: {
		'Lot1:DC Totals:Extended Total Area': {
			upper: 0.169056,
			lower: 0.112704
		},
		'Lot1:DC Totals:Extended Count': {
			upper: 1.2,
			lower: 0.8
		},
		'Lot1:DC Totals:LPD(Sized) Count': {
			upper: 1730.4,
			lower: 1153.6
		},
		'Lot1:DC Totals:LPD(Sized + Sat) Count': {
			upper: 1734,
			lower: 1156
		},
		'Lot1:DC Totals:LPD Size Peak': {
			upper: 0.071376,
			lower: 0.047584
		},
		'Lot1:DC Totals:Sum Of All Count(Defects)': {
			upper: 1735.2,
			lower: 1156.8
		},
		'Lot1:DC Totals:Sum Of All Count(Unclustered)': {
			upper: 1744.8,
			lower: 1163.2
		},
		'Lot1:DW Totals:Extended Total Area': {
			upper: 0.169056,
			lower: 0.112704
		},
		'Lot1:DW Totals:Extended Count': {
			upper: 1.2,
			lower: 0.8
		},
		'Lot1:DW Totals:LPD(Sized) Count': {
			upper: 1728,
			lower: 1152
		},
		'Lot1:DW Totals:LPD(Sized + Sat) Count': {
			upper: 1734,
			lower: 1156
		},
		'Lot1:DW Totals:LPD Size Peak': {
			upper: 0.07128,
			lower: 0.04752
		},
		'Lot1:DW Totals:Sum Of All Count(Defects)': {
			upper: 1735.2,
			lower: 1156.8
		},
		'Lot1:DW Totals:Sum Of All Count(Unclustered)': {
			upper: 1744.8,
			lower: 1163.2
		},
		'Lot1:DN Totals:Extended Total Area': {
			upper: 0,
			lower: 0
		},
		'Lot1:DN Totals:Extended Count': {
			upper: 0,
			lower: 0
		},
		'Lot1:DN Totals:LPD(Sized) Count': {
			upper: 3.6,
			lower: 2.4
		},
		'Lot1:DN Totals:LPD(Sized + Sat) Count': {
			upper: 7.2,
			lower: 4.8
		},
		'Lot1:DN Totals:LPD Size Peak': {
			upper: 0.155256,
			lower: 0.103504
		},
		'Lot1:DN Totals:Sum Of All Count(Defects)': {
			upper: 7.2,
			lower: 4.8
		},
		'Lot1:DN Totals:Sum Of All Count(Unclustered)': {
			upper: 7.2,
			lower: 4.8
		},
		'Lot1:GC Totals:Slipline Total Length': {
			upper: 0,
			lower: 0
		},
		'Lot1:GC Totals:Slipline Count': {
			upper: 0,
			lower: 0
		},
		'Lot1:GC Totals:Scratch Total Length': {
			upper: 0,
			lower: 0
		},
		'Lot1:GC Totals:Scratch Total Area': {
			upper: 0,
			lower: 0
		},
		'Lot1:GC Totals:Scratch Count': {
			upper: 0,
			lower: 0
		},
		'Lot1:GC Totals:Cluster Total Area': {
			upper: 1.04384,
			lower: 0.695896
		},
		'Lot1:GC Totals:Cluster Count': {
			upper: 2.4,
			lower: 1.6
		},
		'Lot1:GC Totals:LPD(Sized) Count': {
			upper: 1723.2,
			lower: 1148.8
		},
		'Lot1:GC Totals:LPD(Sized + Sat) Count': {
			upper: 1726.8,
			lower: 1151.2
		},
		'Lot1:GC Totals:LPD Size Peak': {
			upper: 0.071544,
			lower: 0.047696
		},
		'Lot1:GC Totals:Sum Of All Count(Defects)': {
			upper: 1729.2,
			lower: 1152.8
		},
		'Lot1:GC Totals:Sum Of All Count(Unclustered)': {
			upper: 1744.8,
			lower: 1163.2
		},
		'Lot1:GC LPD Size Bins:Bin1[#]': {
			upper: 1710,
			lower: 1140
		},
		'Lot1:GC LPD Size Bins:Bin2[#]': {
			upper: 9.6,
			lower: 6.4
		},
		'Lot1:GC LPD Size Bins:Bin3[#]': {
			upper: 1.2,
			lower: 0.8
		},
		'Lot1:GC LPD Size Bins:Bin4[#]': {
			upper: 0,
			lower: 0
		},
		'Lot1:GC LPD Size Bins:Bin5[#]': {
			upper: 2.4,
			lower: 1.6
		},
		'Lot1:GC LPD Size Bins:Bin6[#]': {
			upper: 0,
			lower: 0
		},
		'Lot1:GC LPD Size Bins:Bin7[#]': {
			upper: 0,
			lower: 0
		},
		'Lot1:GC LPD Size Bins:Bin8[#]': {
			upper: 0,
			lower: 0
		},
		'Lot1:GC LPD Size Bins:Saturated[#]': {
			upper: 3.6,
			lower: 2.4
		},
		'Lot1:DC OBL Totals:Extended Total Area': {
			upper: 0.169056,
			lower: 0.112704
		},
		'Lot1:DC OBL Totals:Extended Count': {
			upper: 1.2,
			lower: 0.8
		},
		'Lot1:DC OBL Totals:LPD(Sized) Count': {
			upper: 1730.4,
			lower: 1153.6
		},
		'Lot1:DC OBL Totals:LPD(Sized + Sat) Count': {
			upper: 1734,
			lower: 1156
		},
		'Lot1:DC OBL Totals:LPD Size Peak': {
			upper: 0.071376,
			lower: 0.047584
		},
		'Lot1:DC OBL Totals:Sum Of All Count(Defects)': {
			upper: 1735.2,
			lower: 1156.8
		},
		'Lot1:DC OBL Totals:Sum Of All Count(Unclustered)': {
			upper: 1744.8,
			lower: 1163.2
		},
		'Lot1:DC OBL Totals:Original Average(ppm)': {
			upper: 0.047748,
			lower: 0.031832
		},
		'Lot1:DC OBL Totals:Original Median(ppm)': {
			upper: 0.047784,
			lower: 0.031856
		},
		'Lot1:DC OBL Totals:Original StDev(ppm)': {
			upper: 0.000564,
			lower: 0.000376
		},
		'Lot1:DW OBL Totals:Extended Total Area': {
			upper: 0.169056,
			lower: 0.112704
		},
		'Lot1:DW OBL Totals:Extended Count': {
			upper: 1.2,
			lower: 0.8
		},
		'Lot1:DW OBL Totals:LPD(Sized) Count': {
			upper: 1729.2,
			lower: 1152.8
		},
		'Lot1:DW OBL Totals:LPD(Sized + Sat) Count': {
			upper: 1734,
			lower: 1156
		},
		'Lot1:DW OBL Totals:LPD Size Peak': {
			upper: 0.07128,
			lower: 0.04752
		},
		'Lot1:DW OBL Totals:Sum Of All Count(Defects)': {
			upper: 1735.2,
			lower: 1156.8
		},
		'Lot1:DW OBL Totals:Sum Of All Count(Unclustered)': {
			upper: 1744.8,
			lower: 1163.2
		},
		'Lot1:DW OBL Totals:Original Average(ppm)': {
			upper: 0.039576,
			lower: 0.026384
		},
		'Lot1:DW OBL Totals:Original Median(ppm)': {
			upper: 0.039624,
			lower: 0.026416
		},
		'Lot1:DW OBL Totals:Original StDev(ppm)': {
			upper: 0.000444,
			lower: 0.000296
		},
		'Lot1:rejected': {
			upper: 1.2,
			lower: 0.8
		},
		'Lot1:DW OBL LPD Size Bins:Bin1[#]': {
			upper: 1610.4,
			lower: 1073.6
		},
		'Lot1:DW OBL LPD Size Bins:Bin2[#]': {
			upper: 106.8,
			lower: 71.2
		},
		'Lot1:DW OBL LPD Size Bins:Bin3[#]': {
			upper: 9.6,
			lower: 6.4
		},
		'Lot1:DW OBL LPD Size Bins:Bin4[#]': {
			upper: 1.2,
			lower: 0.8
		},
		'Lot1:DW OBL LPD Size Bins:Bin5[#]': {
			upper: 0,
			lower: 0
		},
		'Lot1:DW OBL LPD Size Bins:Bin6[#]': {
			upper: 0,
			lower: 0
		},
		'Lot1:DW OBL LPD Size Bins:Bin7[#]': {
			upper: 0,
			lower: 0
		},
		'Lot1:DW OBL LPD Size Bins:Bin8[#]': {
			upper: 1.2,
			lower: 0.8
		},
		'Lot1:DW OBL LPD Size Bins:Saturated[#]': {
			upper: 4.8,
			lower: 3.2
		},
		'Lot1:DN OBL Totals:Extended Total Area': {
			upper: 0,
			lower: 0
		},
		'Lot1:DN OBL Totals:Extended Count': {
			upper: 0,
			lower: 0
		},
		'Lot1:DN OBL Totals:LPD(Sized) Count': {
			upper: 3.6,
			lower: 2.4
		},
		'Lot1:DN OBL Totals:LPD(Sized + Sat) Count': {
			upper: 7.2,
			lower: 4.8
		},
		'Lot1:DN OBL Totals:LPD Size Peak': {
			upper: 0.155256,
			lower: 0.103504
		},
		'Lot1:DN OBL Totals:Sum Of All Count(Defects)': {
			upper: 7.2,
			lower: 4.8
		},
		'Lot1:DN OBL Totals:Sum Of All Count(Unclustered)': {
			upper: 7.2,
			lower: 4.8
		},
		'Lot1:DN OBL Totals:Original Average(ppm)': {
			upper: 0.00816,
			lower: 0.00544
		},
		'Lot1:DN OBL Totals:Original Median(ppm)': {
			upper: 0.00816,
			lower: 0.00544
		},
		'Lot1:DN OBL Totals:Original StDev(ppm)': {
			upper: 0.00018,
			lower: 0.00012
		},
		'Lot1:DN OBL LPD Size Bins:Bin1[#]': {
			upper: 1.2,
			lower: 0.8
		},
		'Lot1:DN OBL LPD Size Bins:Bin2[#]': {
			upper: 0,
			lower: 0
		},
		'Lot1:DN OBL LPD Size Bins:Bin3[#]': {
			upper: 1.2,
			lower: 0.8
		},
		'Lot1:DN OBL LPD Size Bins:Bin4[#]': {
			upper: 0,
			lower: 0
		},
		'Lot1:DN OBL LPD Size Bins:Bin5[#]': {
			upper: 0,
			lower: 0
		},
		'Lot1:DN OBL LPD Size Bins:Bin6[#]': {
			upper: 0,
			lower: 0
		},
		'Lot1:DN OBL LPD Size Bins:Bin7[#]': {
			upper: 0,
			lower: 0
		},
		'Lot1:DN OBL LPD Size Bins:Bin8[#]': {
			upper: 1.2,
			lower: 0.8
		},
		'Lot1:DN OBL LPD Size Bins:Saturated[#]': {
			upper: 3.6,
			lower: 2.4
		},
		'Lot1:DIC OBL Totals:Extended Total Area': {
			upper: 0,
			lower: 0
		},
		'Lot1:DIC OBL Totals:Extended Count': {
			upper: 0,
			lower: 0
		},
		'Lot1:DIC OBL Totals:PPD(Sized) Count': {
			upper: 0,
			lower: 0
		},
		'Lot1:DIC OBL Totals:PPD(Sized + Sat) Count': {
			upper: 0,
			lower: 0
		},
		'Lot1:DIC OBL Totals:PPD Size Peak': {
			upper: 0,
			lower: 0
		},
		'Lot1:DIC OBL Totals:Sum Of All Count(Defects)': {
			upper: 0,
			lower: 0
		},
		'Lot1:DIC OBL Totals:Sum Of All Count(Unclustered)': {
			upper: 0,
			lower: 0
		},
		'Lot1:DIC OBL Totals:Original Peak(SHE)': {
			upper: 4.25903,
			lower: 2.83935
		},
		'Lot1:DIC OBL Totals:Original Median(SHE)': {
			upper: 2.25769,
			lower: 1.50513
		},
		'Lot1:DIC OBL Totals:Original StDev(SHE)': {
			upper: 0.3453,
			lower: 0.2302
		},
		'Lot1:DIC OBL Totals:Original Average(SHE)': {
			upper: 2.28395,
			lower: 1.52263
		},
		'Lot1:DIC OBL PPD Size Bins:Bin1[#]': {
			upper: 0,
			lower: 0
		},
		'Lot1:DIC OBL PPD Size Bins:Bin2[#]': {
			upper: 0,
			lower: 0
		},
		'Lot1:DIC OBL PPD Size Bins:Bin3[#]': {
			upper: 0,
			lower: 0
		},
		'Lot1:DIC OBL PPD Size Bins:Bin4[#]': {
			upper: 0,
			lower: 0
		},
		'Lot1:DIC OBL PPD Size Bins:Bin5[#]': {
			upper: 0,
			lower: 0
		},
		'Lot1:DIC OBL PPD Size Bins:Bin6[#]': {
			upper: 0,
			lower: 0
		},
		'Lot1:DIC OBL PPD Size Bins:Bin7[#]': {
			upper: 0,
			lower: 0
		},
		'Lot1:DIC OBL PPD Size Bins:Bin8[#]': {
			upper: 0,
			lower: 0
		},
		'Lot1:DIC OBL PPD Size Bins:Saturated[#]': {
			upper: 0,
			lower: 0
		},
		'Lot1:DC NRM Totals:Extended Total Area': {
			upper: 0,
			lower: 0
		},
		'Lot1:DC NRM Totals:Extended Count': {
			upper: 0,
			lower: 0
		},
		'Lot1:DC NRM Totals:LPD(Sized) Count': {
			upper: 4.8,
			lower: 3.2
		},
		'Lot1:DC NRM Totals:LPD(Sized + Sat) Count': {
			upper: 7.2,
			lower: 4.8
		},
		'Lot1:DC NRM Totals:LPD Size Peak': {
			upper: 0.30366,
			lower: 0.20244
		},
		'Lot1:DC NRM Totals:Sum Of All Count(Defects)': {
			upper: 7.2,
			lower: 4.8
		},
		'Lot1:DC NRM Totals:Sum Of All Count(Unclustered)': {
			upper: 7.2,
			lower: 4.8
		},
		'Lot1:DC NRM Totals:Original Average(ppm)': {
			upper: 0.109644,
			lower: 0.073096
		},
		'Lot1:DC NRM Totals:Original Median(ppm)': {
			upper: 0.10968,
			lower: 0.07312
		},
		'Lot1:DC NRM Totals:Original StDev(ppm)': {
			upper: 0.00066,
			lower: 0.00044
		},
		'Lot1:DW NRM Totals:Extended Total Area': {
			upper: 0,
			lower: 0
		},
		'Lot1:DW NRM Totals:Extended Count': {
			upper: 0,
			lower: 0
		},
		'Lot1:DW NRM Totals:LPD(Sized) Count': {
			upper: 2.4,
			lower: 1.6
		},
		'Lot1:DW NRM Totals:LPD(Sized + Sat) Count': {
			upper: 7.2,
			lower: 4.8
		},
		'Lot1:DW NRM Totals:LPD Size Peak': {
			upper: 0.13716,
			lower: 0.09144
		},
		'Lot1:DW NRM Totals:Sum Of All Count(Defects)': {
			upper: 7.2,
			lower: 4.8
		},
		'Lot1:DW NRM Totals:Sum Of All Count(Unclustered)': {
			upper: 7.2,
			lower: 4.8
		},
		'Lot1:DW NRM Totals:Original Average(ppm)': {
			upper: 0.0504,
			lower: 0.0336
		},
		'Lot1:DW NRM Totals:Original Median(ppm)': {
			upper: 0.0504,
			lower: 0.0336
		},
		'Lot1:DW NRM Totals:Original StDev(ppm)': {
			upper: 0.000348,
			lower: 0.000232
		},
		'Lot1:DW NRM LPD Size Bins:Bin1[#]': {
			upper: 1.2,
			lower: 0.8
		},
		'Lot1:DW NRM LPD Size Bins:Bin2[#]': {
			upper: 0,
			lower: 0
		},
		'Lot1:DW NRM LPD Size Bins:Bin3[#]': {
			upper: 0,
			lower: 0
		},
		'Lot1:DW NRM LPD Size Bins:Bin4[#]': {
			upper: 0,
			lower: 0
		},
		'Lot1:DW NRM LPD Size Bins:Bin5[#]': {
			upper: 0,
			lower: 0
		},
		'Lot1:DW NRM LPD Size Bins:Bin6[#]': {
			upper: 0,
			lower: 0
		},
		'Lot1:DW NRM LPD Size Bins:Bin7[#]': {
			upper: 0,
			lower: 0
		},
		'Lot1:DW NRM LPD Size Bins:Bin8[#]': {
			upper: 1.2,
			lower: 0.8
		},
		'Lot1:DW NRM LPD Size Bins:Saturated[#]': {
			upper: 4.8,
			lower: 3.2
		},
		'Lot1:DN NRM Totals:Extended Total Area': {
			upper: 0,
			lower: 0
		},
		'Lot1:DN NRM Totals:Extended Count': {
			upper: 0,
			lower: 0
		},
		'Lot1:DN NRM Totals:LPD(Sized) Count': {
			upper: 4.8,
			lower: 3.2
		},
		'Lot1:DN NRM Totals:LPD(Sized + Sat) Count': {
			upper: 7.2,
			lower: 4.8
		},
		'Lot1:DN NRM Totals:LPD Size Peak': {
			upper: 0.30366,
			lower: 0.20244
		},
		'Lot1:DN NRM Totals:Sum Of All Count(Defects)': {
			upper: 7.2,
			lower: 4.8
		},
		'Lot1:DN NRM Totals:Sum Of All Count(Unclustered)': {
			upper: 7.2,
			lower: 4.8
		},
		'Lot1:DN NRM Totals:Original Average(ppm)': {
			upper: 0.059256,
			lower: 0.039504
		},
		'Lot1:DN NRM Totals:Original Median(ppm)': {
			upper: 0.059268,
			lower: 0.039512
		},
		'Lot1:DN NRM Totals:Original StDev(ppm)': {
			upper: 0.000372,
			lower: 0.000248
		},
		'Lot1:DN NRM LPD Size Bins:Bin1[#]': {
			upper: 1.2,
			lower: 0.8
		},
		'Lot1:DN NRM LPD Size Bins:Bin2[#]': {
			upper: 0,
			lower: 0
		},
		'Lot1:DN NRM LPD Size Bins:Bin3[#]': {
			upper: 0,
			lower: 0
		},
		'Lot1:DN NRM LPD Size Bins:Bin4[#]': {
			upper: 0,
			lower: 0
		},
		'Lot1:DN NRM LPD Size Bins:Bin5[#]': {
			upper: 0,
			lower: 0
		},
		'Lot1:DN NRM LPD Size Bins:Bin6[#]': {
			upper: 1.2,
			lower: 0.8
		},
		'Lot1:DN NRM LPD Size Bins:Bin7[#]': {
			upper: 1.2,
			lower: 0.8
		},
		'Lot1:DN NRM LPD Size Bins:Bin8[#]': {
			upper: 1.2,
			lower: 0.8
		},
		'Lot1:DN NRM LPD Size Bins:Saturated[#]': {
			upper: 2.4,
			lower: 1.6
		}
	}
}

export const limitFor = (tool: string, id: string): Limit | undefined => LIMITS[tool]?.[id]
