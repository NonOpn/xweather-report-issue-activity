Script to highlight issues noticed during exploration of the lightning activity API

**Installation**

- requires node.js (tested with v18.20.7 but should be vanilla-enough)
- update the index.js with the proper credentials
- change the location if required

**HowTo**

- the repo comes with a prefetched activity.json file
- to run against a new batch of data, remove this file
- in a terminal

```
node index.js
```

Note : to run using a fresh dataset, remove the activity.json file

**Expectations**

- the number of regular & analytics data should match over 10min
- a window of lightning activity point with analytic should be absent from the regular dataset due to the mentioned delay in processing and some data point with analytics shouldn't have their counterpart in the regular dataset

**What has been found**

- the number of points with analytics is way lower than the number of lightning activity point without
- almost none lightning activity with analytics are matched (using the timestamp & peakamp)

**Questions**

- are lightning activity points with analytics 1:1 with regular lightning activity points?
- is it expected to have way less activity points with analytics than regular activity points ?
