# server_tsspredator

This directory contains the server-side code for the TSSpredator web application. It is primarily written in Python and is responsible for the core functionality of the application, including the prediction of Transcription Starting Sites (TSS).

## Main Files

- [``__init__.py``](__init__.py): This is the main server component. Built in Flask.

- [``parameter.py``](parameter.py): This file contains classes and functions for handling parameters of TSSpredator.

- [``server_visualization_processing.py``](server_visualization_processing.py): This file contains functions for processing visualizations in the application. The main function, [`from_bedgraph_to_bw`](server_visualization_processing.py), converts bedgraph files to bigwig files for an easy parsing in Gosling.

## Compiled Programs

- [``TSSpredator.jar``](TSSpredator.jar): The most important program, since it predicts the TSS. 

- [`bedGraphToBigWig``](bedGraphToBigWig): Converts bedGraph Files exported from TSSpredator to binary BigWig files for an optimized storage. 


Please note that this is a general overview. For more detailed information, please refer to the comments and documentation in the individual files.