# Export variables for observe stuff
# put your 12 digit tenant id here
export TENANT_ID=""
# put your Datastream TOKEN you created in your observe tenant here
# be sure to create the token under the OTEL app namespace
export DATASTREAM_TOKEN=""



# Install necessary node libs
npm install --save @opentelemetry/api
npm install --save @opentelemetry/auto-instrumentations-node

# Configure via env vars
export OTEL_TRACES_EXPORTER="otlp"
export OTEL_EXPORTER_OTLP_TRACES_ENDPOINT="https://${TENANT_ID}.collect.observeinc.com/v1/otel/v1/traces"
export OTEL_EXPORTER_OTLP_HEADERS="Authorization=Bearer ${DATASTREAM_TOKEN}"
export OTEL_NODE_RESOURCE_DETECTORS=env,host
export OTEL_SERVICE_NAME="example-node-manual-raw"
export NODE_OPTIONS="--require @opentelemetry/auto-instrumentations-node/register"

# Run app
npx ts-node app.ts
