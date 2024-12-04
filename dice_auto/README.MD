# Intro

As a reminder, be sure to to enable K8s that is bunded with Docker Desktop (Settings > Kubernetes > "Enable Kubernetes" and then "Apply & restart"). Once all steps are completed, the example application will be reachable via `https://localhost:30001`.

This is a sample Node app for Observe that is a simple example of instrumenting an uninstrumented app "on the fly"/without source code changes. This particular example takes advantage of the OTEL Operator for Kubernetes, which handles all of the auto instrumentation for you. If you look at the Dockerfile definition, you will see that we are not installing the OTEL auto instrumentation libraries like we do in the `dice_manual` examples. That is because the OTEL operator auto injects them when the container is deployed.

Note: [*ORDER MATTERS*](https://opentelemetry.io/docs/kubernetes/operator/automatic/#were-the-resources-deployed-in-the-right-order) The Instrumentation resource needs to be deployed before before deploying the Dice application, otherwise the auto-instrumentation won’t work!

## Caveats

Ingest tokens should be treated as "secrets" in production. For this example, we're storing them an environment variables, which is fine for localized testing, but please follow security best practices when attempting this in a real environment. 

This was all tested on an M1 Mac locally, and is not intended to be pushed into production as is.


## OTEl Operator for K8s Setup

The below instructions are for a K8s deployment, and specifically K8s running on Docker desktop. This relies on the OTEL Operator for K8s to perform the instrumentation.


## Build or pull the container image for the app

### Build Locally

`docker build -t observe-dice-auto .`

This should create a new container image called `observe-dice-auto` that we will reference later for K8s deployment. Remember *DO NOT DEPLOY THIS TO K8S YET*!

This is tied to the `dice_auto.yaml` file.

### Pull Remote

If you prefer, you can use a pre-built image, available here:

https://hub.docker.com/r/observechamp/observe_auto_instrumentation

This is tied to the `dice_auto_remote.yaml` file.


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

#### Step 3 - install the helm chart from the Observe repo

```
helm install --namespace=observe observe-traces observe/traces \
	--set global.observe.collectionEndpoint="https://${OBSERVE_TENANT}.collect.observeinc.com/" \
	--set observe.token.value="${OBSERVE_INGEST_TOKEN}"
```

#### Step 4 - write out the configuration values to a yaml file locally
```
helm -n observe get values observe-traces -o yaml > observe-traces-values.yaml
```



## OTEL K8s Operator with Auto-Instrumentation Steps

### Step 0 - Set Namespace To Observe
For this example we'll deploy everything into the namespace `observe`. You can use the below command or set the namespace in your yaml files.

```
kubectl config set-context --current --namespace=observe
```

### Step 1 - Install Cert-manager

Cert manager is needed to handle TLS related issues that often come up when testing locally.

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



### Step 2  - Install the OTEL Operator for K8s & Setup Admission Hooks

Install the helm chart for the OTEL K8s operator, per [OTEL Operator Repo](https://github.com/open-telemetry/opentelemetry-helm-charts/tree/main/charts/opentelemetry-operator#opentelemetry-operator-helm-chart). Note that the instructions have changed recently (2024.12.03), due to some nice enhancements to the OTEL helm charts.


```
helm repo add open-telemetry https://open-telemetry.github.io/opentelemetry-helm-charts
helm repo update
```


```
helm install opentelemetry-operator open-telemetry/opentelemetry-operator \
--namespace observe \
--set manager.collectorImage.repository=otel/opentelemetry-collector-k8s \
--set admissionWebhooks.certManager.enabled=false \
--set admissionWebhooks.autoGenerateCert.enabled=true
```


### Step 3 - Deploy the OTEL Operator
For node.js specifically, you can now use the operator, in conjunction with kubectl, to set up auto-instrumentation. Note that the collector endpoint is specific to Observe!

Note you may get an error from the OTEL Operator webhook along the lines of:

`Error from server (InternalError): error when creating "autoinst.yaml": Internal error occurred: failed calling webhook "minstrumentation.kb.io": failed to call webhook: Post "https://opentelemetry-operator-webhook.observe.svc:443/mutate-opentelemetry-io-v1alpha1-instrumentation?timeout=10s": dial tcp 10.111.30.182:443: connect: connection refused`

Just retry the below command until it's successful.

```
kubectl apply -f autoinst.yaml
```


### Step 4 - Deploy our uninstrumented Dice app


If you picked the "Build Locally" option, run the following to deploy our image version "as is", meaning without any of the OTEL libraries installed:

```
kubectl apply -f dice_auto.yaml
```

If you picked the "Pull Remote" option, run the following to deploy our remote build of the image version "as is", this is also built without any of the OTEL libraries installed:

```
kubectl apply -f dice_auto_remote.yaml
```


## How does this work?

While you do not need to install/configure the OTEL auto instrumentation libraries into your node app directly, the operator relies K8s "annotations" to know which language and what containers to auto instrument via the operator. Below is what was added to `dice_auto.yaml` to support this.

```
spec:
   template:
      metadata:
         annotations:
            instrumentation.opentelemetry.io/inject-nodejs: "true"
            instrumentation.opentelemetry.io/container-names: "dice-auto"
```

Also unique to this deployment is the port configuration for our OTEL Collector. Reminder that we are using the Observe version of the Collector, and if you look at `autoinst.yaml` you will see the following:

```
      - name: OTEL_EXPORTER_OTLP_ENDPOINT
        value: http://observe-traces.observe.svc.cluster.local:4317/v1/traces
```

By comparison, if you look at `dice.yaml` in the `dice_manual` directory, you'll see we need to set a number of environment variables in addition to also installing the OTEL libraries during the container build process. 

Additionally, the OTEL exporter is listening on port `4317` for operator auto-instrumented deployments like this one.

```
- name: OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
  value: "http://observe-traces.observe.svc.cluster.local:4317/v1/traces"
```







