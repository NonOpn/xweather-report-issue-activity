const fs = require("fs");

const client_id = "changeme";
const client_secret = "changeme";
const latitude = 45.798793;
const longitude = 13.260553;

const cacheFilePath = "./activity.json";

const wait = async (timeoutS) => new Promise((resolve, reject) => setTimeout(() => resolve(), timeoutS * 1000));

async function fetchRegularAndAnalytics() {
    const params = `?client_id=${client_id}&client_secret=${client_secret}&radius=100Km&limit=1000`;
    const regular_request = await fetch(`https://data.api.xweather.com/lightning/${latitude},${longitude}${params}`, { method: "GET" });
    const analytics_request = await fetch(`https://data.api.xweather.com/lightning/analytics/${latitude},${longitude}${params}`, { method: "GET" });

    const regular = (await regular_request.json()).response;
    const analytics = (await analytics_request.json()).response;

    console.log(`sizes ${regular.length} vs ${analytics.length}`);
    return { regular, analytics };
}

function mergeArrayInset(mapOfActivity, array) {
    array.forEach(element => {
        const existing = mapOfActivity.get(element.id);

        if (!existing) {
            mapOfActivity.set(element.id, element);
        } else if (!!existing && existing.ob.pulse.peakamp != element.ob.pulse.peakamp) {
            console.error(`error ${element.id} is different from previous calls & new one`, {existing, element});
        }
    });
}

async function gatherAndMergeData() {
    var batchOf20s = 0;
    const maximumBatches = 10 * 12;

    // preparing the static maps id -> object;
    const mapRegular = new Map();
    const mapAnalytics = new Map();

    // fetching 
    while (batchOf20s < maximumBatches) { // 30batches of 20s = 10min
        console.log(`preparing batch ${batchOf20s}/${maximumBatches}`); 
        const { regular, analytics } = await fetchRegularAndAnalytics();
        
        mergeArrayInset(mapRegular, regular);
        mergeArrayInset(mapAnalytics, analytics);

        await wait(5);
        batchOf20s++;
    }

    const resultingRegulars = [...mapRegular.values()];
    const resultingAnalytics = [...mapAnalytics.values()];

    const result = {
        regulars: resultingRegulars,
        analytics: resultingAnalytics
    };

    fs.writeFileSync(cacheFilePath, JSON.stringify(result, null, 2));

    return result;
}

async function gatherDataFromFile() {
    if (fs.existsSync(cacheFilePath)) {
        console.log("skipping fetching data, using cached from ./activity.json");
        const content = fs.readFileSync(cacheFilePath, "utf8");
        return JSON.parse(content);
    }

    return gatherAndMergeData();
}

async function runTest() {
    const resultingData = await gatherDataFromFile();

    const { regulars, analytics } = resultingData;

    var numberOfAnalyticsNotFoundInRegularActivities = 0;
    var numberOfAnalyticsWithoutRegularActivityMatching = 0;
    var numberOfAnalyticsAndRegularMatching = 0;

    analytics.forEach(element => {
        const inRegularItems = regulars.filter(inArray => inArray.recTimestamp == element.recTimestamp);

        if (inRegularItems.length > 0) {
            const matchingPeakAmp = inRegularItems.filter(inRegular => inRegular.ob.pulse.peakamp == element.ob.pulse.peakamp);

            if (matchingPeakAmp.length == 0) {
                numberOfAnalyticsWithoutRegularActivityMatching++;
            } else {
                console.log(`${matchingPeakAmp.map(el => el.id)} matching ${element.id}`);
                numberOfAnalyticsAndRegularMatching++;
            }
        } else {
            numberOfAnalyticsNotFoundInRegularActivities++;
        }
    });

    console.log("having regular data", resultingData.regulars.length);
    console.log("having analytics data", resultingData.analytics.length);
    console.log(`number of analytics not found in regular data -> ${numberOfAnalyticsNotFoundInRegularActivities}`);
    console.log(`number of analytics not matching "their" regular counterpart -> ${numberOfAnalyticsWithoutRegularActivityMatching}`);
    console.log(`number of analytics & regular matching together -> ${numberOfAnalyticsAndRegularMatching}`);
}

runTest();