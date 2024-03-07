# Intro

This repo contains a few examples of deploying an OTEL auto-instrumented Node JS app that is configured to ship traces to Observe. There are four permutations to be aware of. The first three are in the `dice_manual` directory of this repo, and the fourth is in the `dice_auto` directory:

# dice_manual directory

1. Run Local Raw - this is done via the `runme.sh` script, and presumes you have nodejs installed locally on your machine. Be sure to set the `TENANT_ID` and `DATASTREAM_TOKEN`

2. Run Local Docker - this is done via the docker-compose.yml file and the associated `docker compose up --build` command. You need to ensure that the environment variables `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` and `OTEL_EXPORTER_OTLP_HEADERS` are properly set with your Observe tenant and Ingest token.

3. Run in K8s via local Docker - you must enable K8s on your Docker install. The steps here are a bit more complex, and outlined below in the `K8s Setup` section.


For options 1 and 2, the dice application is reachable via `http://localhost:8080`. For option 3, it's reachable via `https://localhost:30001`.


# dice_auto directory

4. Run in K8s via local Docker, with the OTEL Operator for Kuberenes (again, you must enable K8s on your Docker install). The steps here are a bit more complex, but are outlined in the `README.MD` in the dice_auto directory.

For option 4, the application is reachable via `https://localhost:30001`.


## Caveats

Ingest tokens should be treated as "secrets" in production. For this example, we're storing them in environment variables, which is fine for localized testing, but please follow security best practices when attempting this in a real environment. 

This was all built & tested on an M1 Mac, and is not intended to be pushed into production as is.


## K8s Setup

All Kubernetes related commands were tested via K8s running on Docker desktop.


### Build the container image for the app
There are container image build instructions in each directory (`dice_auto` and `dice_manual`) - follow the specific README.MD files in each subdirectory.

For the manual instrumentation case, you will create an image called `dice` that we will reference later for the K8s deployment that does not use the OTEL operator. The `dice-auto` image will be used by the OTEL operator, and does not build an image that includes the OTEL auto instrumentation libraries.


### Set up the Observe collector and deploy it via Helm

These steps are the same as those bundled with the Observe OTEL App instructions available in your Observe tenant. For step 3, update the values to match your environment, specifically for:

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

#### Step 3 - install the helm chart from the Observe repo

Update the token value and url value to be appropriate for your tenant!

```
helm install --namespace=observe observe-traces observe/traces \
	--set global.observe.collectionEndpoint="https://${OBSERVE_TENANT}.collect.observeinc.com/" \
	--set observe.token.value="${OBSERVE_INGEST_TOKEN}"
```



### Switch your default K8s namespace to be Observe

`kubectl config set-context --current --namespace=observe`

### Apply our k8s yaml for dice

`kubectl apply -f dice.yaml`



# Experimental - OTEL K8s Operator with Auto-Instrumentation
**Order matters!**

The Instrumentation resource needs to be deployed before before deploying the application, otherwise the auto-instrumentation won’t work.

## Step -1 
Follow the previous steps for deploying the Observe collector in
> Set up the Observe collector and deploy it via Helm


## Step 0

Cert-manager install steps - you probably need cert manager to handle TLS certificate deployment and management, so you don't get TLS or SSL related errors.

```
helm repo add jetstack https://charts.jetstack.io --force-update
helm repo update
helm install \
  cert-manager jetstack/cert-manager \
  --namespace observe \
  --create-namespace \
  --version v1.14.3 \
  --set installCRDs=true
```

## Step 1
In the dockerfile, comment out the install lines for OTEL libraries
```
#RUN npm install --save @opentelemetry/api
#RUN npm install --save @opentelemetry/auto-instrumentations-node
```

be sure to also remove the references from package.json if they are there, and then rebuild the container


`docker build -t dice .`


## Step 2 
Install the helm chart for the OTEL K8s operator and for cert-manager, per [OTEL Operator Repo](https://github.com/open-telemetry/opentelemetry-helm-charts/tree/main/charts/opentelemetry-operator#opentelemetry-operator-helm-chart)


```
helm repo add open-telemetry https://open-telemetry.github.io/opentelemetry-helm-charts
helm repo update
```


```
helm install --namespace observe --set admissionWebhooks.certManager.enabled=false --set admissionWebhooks.certManager.autoGenerateCert=true \
  opentelemetry-operator open-telemetry/opentelemetry-operator
```


## Step 3
For node.js specifically, you can now use the operator, in conjunction with kubectl, to set up auto-instrumentation. Note that the collector endpoint is specific to Observe!

Note you may get an error from the OTEL Operator webhook, just retry the command.

```
kubectl apply -f autoinst.yaml
```


## Step 4

Deploy our app version "as is", meaning without any of the OTEL libraries installed:

```
kubectl config set-context --current --namespace=observe
kubectl apply -f dice_auto.yaml
```



Additional Items that may be optional?

```
    image: dice
    env:
      - name: OTEL_NODE_RESOURCE_DETECTORS
        value: env,host
      - name: OTEL_SERVICE_NAME
        value: otel-operator-node
      - name: OTEL_TRACES_EXPORTER
        value: otlp
      - name: OTEL_EXPORTER_OTLP_ENDPOINT
        value: http://observe-traces.observe.svc.cluster.local:4318/v1/traces
```


