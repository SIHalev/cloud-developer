const AWS = require('aws-sdk');
const axios = require('axios');

// Name of a service, any string
const serviceName = process.env.SERVICE_NAME;
// URL of a service to test
const url = process.env.URL;

// CloudWatch client
const cloudwatch = new AWS.CloudWatch();

exports.handler = async (event) => {
    let endTime;
    let requestWasSuccessful;
    const startTime = timeInMs();
    try {
        let axiosResponse = await axios.get(url);
        requestWasSuccessful = (axiosResponse.status === 200);
    } catch (e) {
        requestWasSuccessful = false;
    } finally {
        endTime = timeInMs();
    }

    await cloudWatchEvent('Successful', 'Count', requestWasSuccessful ? 1 : 0);
    await cloudWatchEvent('Latency', 'Milliseconds', endTime - startTime);

    function cloudWatchEvent(name, unit, value) {
        return cloudwatch.putMetricData({
            MetricData: [
                {
                    MetricName: name,
                    Dimensions: [
                        {
                            Name: 'ServiceName',
                            Value: serviceName
                        }
                    ],
                    Unit: unit,
                    Value: value
                }
            ],
            Namespace: 'Udacity/Serveless'
        }).promise();
    }
};

function timeInMs() {
    return new Date().getTime()
}
