# TSSpredator-Web
[![DOI](https://zenodo.org/badge/483954807.svg)](https://doi.org/10.5281/zenodo.15525159)

## Short overview

A web-application for the predication of Transcription Starting Sites (TSS) using Wiggle files and TSSpredator.

Besides facilitating the overall prediction of the TSS by providing a web-application, the interface facilitates the file allocation by allowing a drag-and-drop distribution of the files. Moreover, all config files can be saved and easily uploaded for any re-anaysis of the data. 

While predicting the TSSs, a status website is provided. This allows users to close the browser without interrupting the prediction of the TSSs. 

The application also allows the exploration of the results by providing overview and detail visualizations. 

All results and figures can be also exported from the web-app. 

TSSpredator-Web is available at: <https://tsspredator-tuevis.cs.uni-tuebingen.de/>

## Local usage via Docker

You can also use TSSpredator in your own computer via the provided Docker images. 
- Make sure your Docker engine is running.
- Download the latest Docker images from the [Release](https://github.com/Integrative-Transcriptomics/TSSpredator-Web/releases)
- Download the latest variables_tsspredator.env from [GitHub](https://github.com/Integrative-Transcriptomics/TSSpredator-Web/blob/main/variables_tsspredator.env)
- Adapt the variables_tsspredator.env for your own files:

    1) The path of the example files. This is only required if you want to use the example files, which you can download [here](https://itnc.cs.uni-tuebingen.de/index.php/s/NrggHJCPZRxJMFG). Unzip the data folder, and link to the path on your computer. 
    2) The path for your redis database. This can be anywhere on your computer. 

- Download the latest Docker compose file from [GitHub](https://github.com/Integrative-Transcriptomics/TSSpredator-Web/blob/main/docker-compose.yml)
- On the folder that contains your Docker compose, the Environment file, and the downloaded images file, run:

```bash
# load the images from the tar file
docker load --input TSSpredatorCelery
docker load --input TSSpredatorWeb
# run the container
docker compose --env-file variables_tsspredator.env up -d
```

## Local usage via Yarn and Mamba

### Requirements

- Yarn (v4.1.1)
- mamba/conda
- java (v20.0.1)

### Running locally

```bash
bash setup.sh
yarn run tsspredator
```
