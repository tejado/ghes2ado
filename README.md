# GHES to Azure DevOps

A proof-of-concept to push a pipeline definition (pipeline.yaml) from a private GHES (GitHub Enterprise Server) repository - not reachable by Internet - to Azure DevOps Service.

An Azure Function will be the webhook endpoint to receive "push" events from GHES and doing all the magic.