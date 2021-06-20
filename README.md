# GEE_mesma_seasonal Mann-Kendall test

This code is designed in Google Earth engine (GEE) platform for estimates of endmemebr fractions using Multiple Endmember Spectral Mixture Analysis (MESMA) approach.                                                                               
# MESMA
The pixels recorded in satellite images often contain more than one ground units, this leads to inaccuracies in the monitoring of surface structure, state and function. Recent advances in spectral mixture analysis (SMA) methods have facilitated investigation of estimating fractional endmember abundances in the mixed pixels. This method assumes that the reflectance of target mixing pixel is a linear combination of the weighting coefficients (proportional endmembers) and associated pure spectra.

The Multiple Endmember Spectral Mixture Analysis (MESMA) has been used for to estimate fractional vegetation-soil continues nexuses based on selected endmember spectra. The fully constrained least squares SMA model is selected to estimate fractions and count RMSE for each endmember combination in GEE platform. We finally search a specific endmember combination with the smallest RMSE, and achieve the estimated endmember fractions of this combination as final fractions. In addition, for endmembers that are not included the achieved combination, we set the fraction values of these endmembers as 0. 

# Seasonal Mann-Kendall test
Mann-Kendall test is commonly referred to as a nonparametric test method, which is procedures that detects monotonic trends of sequences over time. This approach is robustness for trend detection and insensitivity to outliers, and provided with an asymptotic relative efficiency of 0.98 relative to the parametric test derived from the coefficient of regression slope. When seasonal environmental data of interest are available as time series for which the time intervals between adjacent observations arc less than one year (i.e., daily, weekly, and monthly sequences), the null hypothesis of common Mann-Kendall test may be too restrictive. Therefore, a multivariate extension of the Mann-Kendall test has been advanced to handle seasonal sequences.

The seasonal Mann-Kendall test is commonly applied to identify trends for seasonal environmental data of interest that is available as time series for which the time intervals between adjacent observations arc less than one year (i.e., daily, weekly, and monthly sequences). Letting the sequence X consists of a complete seasonal record of n year that includes m seasons per year, the X can be expressed by

![image](https://user-images.githubusercontent.com/39107952/121304324-c70b0980-c92e-11eb-9158-27804ef54503.png)

The null hypothesis, H0, is that the n observations come from each of m seasons with independent realizations are identically distributed. While the alternative hypothesis (HA) of a two-sided test is that data presents a monotonic trend. The Seasonal Mann-Kendall test statistic for the g th season is

![image](https://user-images.githubusercontent.com/39107952/121304493-ff124c80-c92e-11eb-9d97-35c50f359e8a.png)

where

![image](https://user-images.githubusercontent.com/39107952/121304552-12251c80-c92f-11eb-83e0-06bb5ac3eb2a.png)

Sg is asymptotically normally distributed, thus the mean of Sg is E[Sg]=0, and the variance is

![image](https://user-images.githubusercontent.com/39107952/121304654-354fcc00-c92f-11eb-8ae2-ab58ded03c43.png)

where n is the number of years of each season, p is the number of tied groups for data x_ig, i=1,2,…n, in season g, and t_j is the number of data points in the jth tied group. The seasonal Mann-Kendall test statistic is 

![image](https://user-images.githubusercontent.com/39107952/121304741-4c8eb980-c92f-11eb-914e-11c3e5f7c083.png)

which is also asymptotically normally distributed where E[S]=0, thus the variance of S is, 

![image](https://user-images.githubusercontent.com/39107952/121304792-5ca69900-c92f-11eb-81bb-9a594059caaa.png)

And the statistic S is approximately normal distributed provided that the following Z-transformation is employed,

![image](https://user-images.githubusercontent.com/39107952/121304842-6fb96900-c92f-11eb-8bc5-236d6f0b7c70.png)

For a given α-significance level, the original null hypothesis (H0) is unacceptable if |Z|≥Z_(1-α/2). This implies a significantly upward or downward trend in the series.

Theil-Sen estimator is a method of robust linear regression by selecting the median value of the slope of all lines passing through the paired points. It is also known as Sen's slope estimation 7. Here, we detect slope of fractions according to seasonal Sen's method 6. For sequence X consisting of a complete seasonal record of n year that includes m seasons per year, a set of linear slopes is calculated as,

![image](https://user-images.githubusercontent.com/39107952/121304912-88c21a00-c92f-11eb-8f97-b1988db54ba9.png),

For each x_(i,j),x_(i,k)  pair i=1,2,…,m,1≤k<j≤n, where n is length of gth season. and seasonal Sen's slope is then calculated as the median from all slopes

The codes for seasonal Mann-Kendall test referd to the tutorials “Non-Parametric Trend Analysis” contributed by the Earth Engine developer community (https://developers.google.cn/earth-engine/tutorials/community/nonparametric-trends), provided by Author(s): n-clinton.

