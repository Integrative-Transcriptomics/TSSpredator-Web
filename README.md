# TSSpredator-java-code

sende json String an .jar Datei:
1. run TSS prediction:  
    json String: {'loadConfig': 'false', 'saveConfig': 'false', 'loadAlignment': 'false', 'configFile': '', ...PARAMETER..., ...GENOMES..., ...REPLICATES...}  
2. load config file:  
   json String: {'loadConfig': 'true', 'saveConfig': 'false', 'loadAlignment': 'false', 'configFile': FILE_PATH}  
3. save config file:  
   json String: {'loadConfig': 'false', 'saveConfig': 'true', 'loadAlignment': 'false', 'configFile': FILE_PATH}  
4. read alignment file to get genome names/ids  
   json String: {'loadConfig': 'false', 'saveConfig': 'false', 'loadAlignment': 'true', 'alignmentFile': FILE_PATH}
