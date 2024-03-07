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

