# GEE_mesma_seasonal Mann-Kendall test

# MESMA
The pixels recorded in satellite images often contain more than one ground units, this leads to inaccuracies in the monitoring of surface structure, state and function. Recent advances in spectral mixture analysis (SMA) methods have facilitated investigation of estimating fractional endmember abundances in the mixed pixels. This method assumes that the reflectance of target mixing pixel is a linear combination of the weighting coefficients (proportional endmembers) and associated pure spectra.

The Multiple Endmember Spectral Mixture Analysis (MESMA) has been used for to estimate fractional vegetation-soil continues nexuses based on selected endmember spectra. The fully constrained least squares SMA model is selected to estimate fractions and count RMSE for each endmember combination in GEE platform. We finally search a specific endmember combination with the smallest RMSE, and achieve the estimated endmember fractions of this combination as final fractions. In addition, for endmembers that are not included the achieved combination, we set the fraction values of these endmembers as 0. 

# Seasonal Mann-Kendall test
Mann-Kendall test is commonly referred to as a nonparametric test method, which is procedures that detects monotonic trends of sequences over time. This approach is robustness for trend detection and insensitivity to outliers, and provided with an asymptotic relative efficiency of 0.98 relative to the parametric test derived from the coefficient of regression slope. When seasonal environmental data of interest are available as time series for which the time intervals between adjacent observations arc less than one year (i.e., daily, weekly, and monthly sequences), the null hypothesis of common Mann-Kendall test may be too restrictive. Therefore, a multivariate extension of the Mann-Kendall test has been advanced to handle seasonal sequences. 

The codes for seasonal Mann-Kendall test referd to the tutorials “Non-Parametric Trend Analysis” contributed by the Earth Engine developer community (https://developers.google.cn/earth-engine/tutorials/community/nonparametric-trends), provided by Author(s): n-clinton.

