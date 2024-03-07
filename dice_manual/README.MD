# Intro

This is a sample Node app for Observe that is a simple example of deploying an OTEL auto-instrumented Node JS app that is configured to ship traces to Observe. There are three permutations to be aware of:

1. Run Local Raw - this is done via the `runme.sh` script, and presumes you have nodejs installed locally on your machine. Be sure to set the `TENANT_ID` and `DATASTREAM_TOKEN`

2. Run Local Docker - this is done via the docker-compose.yml file and the associated `docker compose up --build` command. You need to ensure that the environment variables `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` and `OTEL_EXPORTER_OTLP_HEADERS` are properly set with your Observe tenant and Ingest token.

3. Run in K8s via local Docker - you must enable K8s on your Docker install. The steps here are a bit more complex, and outlined below in the `K8s Setup` section.


For options 1 and 2, the dice application is reachable via `http://localhost:8080`. For option 3, it's reachable via `https://localhost:30001`.

## Caveats

Ingest tokens should be treated as "secrets" in production. For this example, we're storing them an environment variables, which is fine for localized testing, but please follow security best practices when attempting this in a real environment. 

This was all tested on an M1 Mac locally, and is not intended to be pushed into production as is.


## K8s Setup

The below instructions are for a K8s deployment, and specifically K8s running on Docker desktop.


### Build the container image for the app

`docker build -t dice .`

This should create a new container image called `dice` that we will reference later for K8s deployment.


### Set up the Observe collector and deploy it via Helm

These steps are cribbed from the existing OTEL App instructions on your Observe tenant. For step 3, update the values to match your environment, specifically for:
`global.observe.collectionEndpoint` and
`observe.token.value`

#### Step 1 - create a new cluster and namespace
```
CLUSTER_NAME="ObserveCollector"
kubectl create namespace observe && \
kubectl annotate namespace observe observeinc.com/cluster-name="$CLUSTER_NAME"
```

#### Step 2 - add the Observe Helm repo

```
helm repo add observe https://observeinc.github.io/helm-charts
helm repo update
```

#### Step 3 - install the helm chart from the Observe repo & set configurations

Note: this is where your collector configuration goes, including your ingestion token/secret!

```
helm install --namespace=observe observe-traces observe/traces \
	--set global.observe.collectionEndpoint="https://${OBSERVE_TENANT}.collect.observeinc.com/" \
	--set observe.token.value="${OBSERVE_INGEST_TOKEN}"
```

#### Step 4 - write out the configuration values to a yaml file locally
```
helm -n observe get values observe-traces -o yaml > observe-traces-values.yaml
```

### Switch your default K8s namespace to be Observe

`kubectl config set-context --current --namespace=observe`

### Apply our k8s yaml for dice
`kubectl apply -f dice.yaml`