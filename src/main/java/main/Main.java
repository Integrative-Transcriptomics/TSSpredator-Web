package main;

import contighandlerNew.MultiContigHandler;
import genomic.FASTAWriter;
import genomic.GFFio;
import genomic.Gene;
import genomic.NameListReader;
import json.JSONparser;
import json.JSONwrite;
import supergenome.*;
import tss.TSS;
import tss.TSSclassifier;
import tss.TSSpredictor;
import tss.TSSsetComparator;
import utils.ioNew.Pair;
import wiggle.XYio;
import wiggle.XYnorm;
import wiggle.XYtools;
import wiggle.ioNew.WiggleParser;

import java.io.*;
import java.util.*;
import java.util.List;

public class Main {

    public static String programInfo = "TSSpredator v1.1beta   --  built 2021/03/31  --  http://it.inf.uni-tuebingen.de/tsspredator\n";


    /**
     * The default gene identifier type.
     * We need that as a crosslink-id for matching
     * fasta, wiggle and gff entries especially
     * in the multi-contig case.
     */

    private static Map<String, double[][]> fivePrimePlusMap;
    private static Map<String, double[][]> normalPlusMap;
    private static Map<String, double[][]> fivePrimeMinusMap;
    private static Map<String, double[][]> normalMinusMap;

    private String JSONfile;
    private boolean loadConfig = false;
    private boolean saveConfig = false;
    private boolean readAlignment = false;
    private Map<String, String> values;

    // saves input of the jar file
    public Main(String input1) {
        this.JSONfile = input1;
    }

    // read json string
    public Main(boolean loadConfig, boolean saveConfig, boolean readAlignment, Map<String, String> values) {
        this.loadConfig = loadConfig;
        this.saveConfig = saveConfig;
        this.readAlignment = readAlignment;
        this.values = values;
    }

    /**
     * runs TSS prediction, reads config file or writes config file
     */
    public void compute() throws Exception {

        // read JSON string
        Main main = JSONparser.parse(this.JSONfile);
        this.values = main.values;
        this.saveConfig = main.saveConfig;
        this.loadConfig = main.loadConfig;
        this.readAlignment = main.readAlignment;

        // read config file
        if(this.loadConfig) {
            // under 'configFile' the path to the file is saved
            Config.readConfigFile(this.values.get("configFile"));
            this.values = Config.getConfig();
            String json = JSONwrite.write(this.values);
            System.out.println(json);

        // create config File
        } else if(this.saveConfig) {
            saveConfig();

        // read alignment File
        } else if(this.readAlignment) {
            String json = setNamesAndIDsFromXMFA(this.values.get("alignmentFile"));
            System.out.println(json);

        // Start TSS prediction
        } else {
            Config.setConfig(this.values);
            alignMode();
        }
    }

    public static Map<String, String> DEFAULT_SEQUENCE_IDENTIFIER = new HashMap<>();

    /**
     * saves input as config file
     */
    public void saveConfig() {

        Map<String, String> values = this.values;

        List<String> keys = new LinkedList<>(values.keySet());
        Collections.sort(keys);

        try {
            BufferedWriter bw = new BufferedWriter(new FileWriter(this.values.get("configFile")));

            for (String s : keys) {
                if(!s.equals("configFile") && !s.equals("outputDirectory")) {
                    bw.write(s + " = " + values.get(s));
                    bw.newLine();
                }
            }
            bw.close();
        } catch (Exception e) {
            System.err.print("An error occured while saving the configuration:\n" + e.getMessage());
        }
    }

    public void alignMode() throws Exception {

        long timeStart = System.currentTimeMillis();

        System.out.println(programInfo);

        //IDs
        String[] ids = Config.getString("idList").split(",");

        //print rep stats
        boolean printRepStats = false;
        if (Config.entryExists("printReplicateStats"))
            printRepStats = Config.getBoolean("printReplicateStats");


        //RepIDs
        char[] repIDs = {'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'};

        if (Parameters.numReplicates > 26) {
            System.err.println("Not more than 26 replicates supported!");
            return;
        }
        if (ids.length != Config.getInt("numberOfDatasets")) {
            System.err.println("numberOfDatasets does not match length of idList!");
            return;
        }
        //output directory
        String outDir = Config.getString("outputDirectory") + "/";

        //Genomes and Annotations
         System.out.println("Reading Genomes and Annotations...");

        Map<String, String> genomeMap = new HashMap<String, String>();

        Map<String, MultiContigHandler> contigHandlerMap = new HashMap<>();

        ArrayList<String> genomeNames = new ArrayList<>();
        for (String id : ids) {
            MultiContigHandler newHandler = new MultiContigHandler();
            newHandler.parseAndMergeFASTANew(Config.getString("genome_" + id), DEFAULT_SEQUENCE_IDENTIFIER.get(id));
            // System.out.println("contighandler" + id + " DS " + DEFAULT_SEQUENCE_IDENTIFIER.get(id));

            contigHandlerMap.put(id, newHandler);

            genomeMap.put(id, newHandler.getSuperContig());

        }
        // System.out.println("sizeGenomeMap:" + genomeMap.size());

        Map<String, List<Gene>> annotationMap = new HashMap<String, List<Gene>>();
        for (String id : ids) {

        	/* Check, if we have a multi-FASTA file as input,
            which means, that we also check for multiple GFF files
            automatically in the same directory
             */
            // System.out.println("size: " + contigHandlerMap.get(id).getFASTAentries().size());
            if (contigHandlerMap.get(id).getFASTAentries().size() > 1) {
                //store fastaEntries
                Set<String> fastaEntries = contigHandlerMap.get(id).getFASTAentries().keySet();
                Object[] fastaIDs = fastaEntries.toArray();
                // System.out.println(fastaEntries.toString());
                //store GFF files
                List<String> allGffs = GFFio.scanDir(Config.getString("annotation_" + id));
                //System.out.println("gffs: " + allGffs);
                List<String> gffIdentifier = GFFio.extractAnnotationIdentifier(Config.getString("annotation_" + id));
                //System.out.println("size " + gffIdentifier.size());

                for (int i = 0; i < gffIdentifier.size(); i++) {
                    //System.out.println("gff: " + gffIdentifier.get(i));
                }

                //store chromosome Names of all wiggle files
                LinkedHashMap<String, LinkedList<Pair<Integer, Double>>> wiggleFiles = WiggleParser.parseWiggleFileNew(Config.getString("fivePrimePlus_" + id + "a"), "");
                Set<String> chromNames = wiggleFiles.keySet();
                Object[] chromosomeNames = chromNames.toArray();
                for (String s : fastaEntries) {
                    for (String w : chromNames) {
                        if (s.equals(w)) {
                            if (!gffIdentifier.contains(s)) {
                                System.out.println("Fasta ID: " + s + " and" + " Wiggle ID: " + w + " could not found in gff header! \n "
                                        + "Either other header is used or annotation file is not available! In the last case TSS will be classified as orphan!");
                            }
                        }
                    }
                }

                annotationMap.put(id, GFFio.parseMultiGFF(Config.getString("annotation_" + id), contigHandlerMap.get(id), Config.getString("outputID_" + id), System.out));
                //System.out.print("anno: " + annotationMap.get(id));
                //System.out.println("id: " +  id + "entries" + contigHandlerMap.get(id).getFASTAentries());
                //the case with only one fasta entry and one gff file
            } else {
                try {
                    String df = EvaluateIdentifier.evaluateCommonIdentifierNew(Config.getString("genome_" + id), Config.getString("fivePrimePlus_" + id + "a"), System.out, Config.getString("annotation_" + id));
                    //System.out.println("testid: "+df);
                    DEFAULT_SEQUENCE_IDENTIFIER.put(id, df);
                    //System.out.println(DEFAULT_SEQUENCE_IDENTIFIER);
                    //DEFAULT_SEQUENCE_IDENTIFIER = EvaluateIdentifier.evaluateCommonIdentifierNew(Config.getString("genome_1"),
                    // Config.getString("fivePrimePlus_1a"), Config.getString("annotation_1")); }
                } catch (IOException e) {
                    throw new Exception("Could not find " + e.getMessage()); //System.out.println("default sequence identifier: " + DEFAULT_SEQUENCE_IDENTIFIER);
                }
                System.out.println("Common Identifier " + DEFAULT_SEQUENCE_IDENTIFIER.get(id) + " was found.");
                //System.err.println("Hello");
                if (DEFAULT_SEQUENCE_IDENTIFIER.get(id) == null) {
                    //throw new Exception("A common gene identifier (gi, gb, ref...) has to be present in all files! check for files");
                    throw new Exception("A common identifier has to be present in all files! Check for identifiers in files!");
                }

                annotationMap.put(id, GFFio.parseGFF(Config.getString("annotation_" + id), Config.getString("outputID_" + id), System.out));
            }
        }


        //check if annotation file is available
        if (annotationMap.get("1").size() == 0) {
            System.out.println("There is no annotation file! All TSS will be classified as orphan!");
        }

        //read alignment
        SuperGenome superG;
        if (Config.getString("mode").equalsIgnoreCase("align")) {
            System.out.println("Reading alignment...");
            List<XmfaBlock> alignmentBlocks = XmfaParser.parseXmfa(Config.getString("xmfa"));

            //SuperGenome
            System.out.println("Building SuperGenome...");
            superG = new SuperGenome(alignmentBlocks, ids);
        } else if (Config.getString("mode").equalsIgnoreCase("cond")) {
            superG = new SuperGenome(genomeMap.values().iterator().next().length(), ids);
        } else {
            System.err.println("Unknown mode: " + Config.getString("mode") + " Please check the config file. 'mode' has to be 'align' or 'cond'.");
            return;
        }

        //correct annotations
        if (Config.entryExists("annotationCorrection")) {
            // System.out.println("CorrSet contains javaecting Annotations...");
            // System.err.println("Follow 'SOP for annotation correction' carefully! (See respective e-mail)");
            Map<String, String[]> corrMap = NameListReader.readKonradsCorrectedAnnotations(Config.getString("annotationCorrection"));

            for (String id : ids)
                for (Gene g : annotationMap.get(id)) {
                    if (corrMap.containsKey(g.getId())) {
                        g.setStart(Integer.parseInt(corrMap.get(g.getId())[0]) + 1); // Konrads coords are 0-based...
                        g.setEnd(Integer.parseInt(corrMap.get(g.getId())[1])); // ...and end-exclusive

                        g.corrected = corrMap.get(g.getId())[2];

                        corrMap.remove(g.getId());
                    }
                }

            if (corrMap.keySet().size() > 0) {
                System.err.println(corrMap.keySet().size() + " elements in the annotation correction list could not be matched:\n");
                for (String s : corrMap.keySet())
                    System.err.println(s);
            }
        }

        //sRNA locus tags if available
        Map<String, Set<String>> sRNAnameMap = new HashMap<String, Set<String>>();
        for (String id : ids) {
            sRNAnameMap.put(id, new HashSet<String>());
            if (Config.entryExists("sRNA-annotation_" + id))
                sRNAnameMap.put(id, NameListReader.readNameList(Config.getString("sRNA-annotation_" + id)));
        }

        //asRNA locus tags if available
        Map<String, Set<String>> asRNAnameMap = new HashMap<String, Set<String>>();
        for (String id : ids) {
            asRNAnameMap.put(id, new HashSet<String>());
            if (Config.entryExists("asRNA-annotation_" + id))
                asRNAnameMap.put(id, NameListReader.readNameList(Config.getString("asRNA-annotation_" + id)));
        }

        ////Graph files
        System.out.println("Reading Graph files...");
        double[][] tmpGraphs;

        boolean alreadyCached = fivePrimePlusMap != null;

        if (alreadyCached) {
            System.out.println("\tusing cached data");
        }

        //FivePrime fow
        if (!alreadyCached) {
            System.out.print("\tfivePrimePlus");
            fivePrimePlusMap = new HashMap<String, double[][]>();
            for (String id : ids) {
                MultiContigHandler currentHandler = contigHandlerMap.get(id);
                tmpGraphs = new double[Parameters.numReplicates][];
                for (int i = 0; i < Parameters.numReplicates; i++) {
                    //currentHandler.setAndParseWiggleFileNew(Config.getString("fivePrimePlus_"+id+repIDs[i]), DEFAULT_SEQUENCE_IDENTIFIER.get(id));
                    currentHandler.setAndParseWiggleFileNew(Config.getString("fivePrimePlus_" + id + repIDs[i]), ""); //string is not used in the functions, currently used as placeholder
                    //System.out.println("looooo");
                    //System.out.println("identifier: " + DEFAULT_SEQUENCE_IDENTIFIER);
                    tmpGraphs[i] = currentHandler.setAndParseWiggleFileNew(Config.getString("fivePrimePlus_" + id + repIDs[i]), "").makeSuperContig(true).getSuperWiggle();
                    tmpGraphs[i][0] = 1;
                    currentHandler.clearWiggleMerger();
                    //tmpGraphs[i] = XYio.readXYfile(Config.getString("fivePrimePlus_"+id+repIDs[i]), genomeMap.get(id).length(), 1);
                    System.out.print(".");
                }
                fivePrimePlusMap.put(id, tmpGraphs);
            }
            System.out.print("\n");
        }

        //Normal fow
        if (!alreadyCached) {
            System.out.print("\tnormalPlus");
            normalPlusMap = new HashMap<String, double[][]>();
            for (String id : ids) {
                MultiContigHandler currentHandler = contigHandlerMap.get(id);
                tmpGraphs = new double[Parameters.numReplicates][];
                for (int i = 0; i < Parameters.numReplicates; i++) {
                    tmpGraphs[i] = currentHandler.setAndParseWiggleFileNew(Config.getString("normalPlus_" + id + repIDs[i]), DEFAULT_SEQUENCE_IDENTIFIER.get(id)).makeSuperContig(true).getSuperWiggle();
                    //System.out.println("laaa");
                    //System.out.println("identifier: " + DEFAULT_SEQUENCE_IDENTIFIER);
                    tmpGraphs[i][0] = 1;
                    currentHandler.clearWiggleMerger();
                    //tmpGraphs[i] = XYio.readXYfile(Config.getString("normalPlus_"+id+repIDs[i]), genomeMap.get(id).length(), 1);
                    System.out.print(".");
                }
                normalPlusMap.put(id, tmpGraphs);
            }
           System.out.print("\n");
        }

        //FivePrime rev
        if (!alreadyCached) {
            System.out.print("\tfivePrimeMinus");
            fivePrimeMinusMap = new HashMap<String, double[][]>();
            for (String id : ids) {
                //System.out.println("id: "+ id);
                MultiContigHandler currentHandler = contigHandlerMap.get(id);
                tmpGraphs = new double[Parameters.numReplicates][];
                for (int i = 0; i < Parameters.numReplicates; i++) {
                    tmpGraphs[i] = currentHandler.setAndParseWiggleFileNew(Config.getString("fivePrimeMinus_" + id + repIDs[i]), DEFAULT_SEQUENCE_IDENTIFIER.get(id)).makeSuperContig(true).getSuperWiggle();
                    //System.out.println("leee");
                    //System.out.println("identifier: " + DEFAULT_SEQUENCE_IDENTIFIER);
                    tmpGraphs[i][0] = -1;
                    currentHandler.clearWiggleMerger();
                    //tmpGraphs[i] = XYio.readXYfile(Config.getString("fivePrimeMinus_"+id+repIDs[i]), genomeMap.get(id).length(), -1);
                    System.out.print(".");
                }
                fivePrimeMinusMap.put(id, tmpGraphs);
            }
            System.out.print("\n");
        }

        //Normal rev
        if (!alreadyCached) {
            System.out.print("\tnormalMinus");
            normalMinusMap = new HashMap<String, double[][]>();
            for (String id : ids) {
                MultiContigHandler currentHandler = contigHandlerMap.get(id);
                tmpGraphs = new double[Parameters.numReplicates][];
                for (int i = 0; i < Parameters.numReplicates; i++) {
                    tmpGraphs[i] = currentHandler.setAndParseWiggleFileNew(Config.getString("normalMinus_" + id + repIDs[i]), DEFAULT_SEQUENCE_IDENTIFIER.get(id)).makeSuperContig(true).getSuperWiggle();
                    //System.out.println("luu");
                    //System.out.println("identifier: " + DEFAULT_SEQUENCE_IDENTIFIER);
                    tmpGraphs[i][0] = -1;
                    currentHandler.clearWiggleMerger();
                    //tmpGraphs[i] = XYio.readXYfile(Config.getString("normalMinus_"+id+repIDs[i]), genomeMap.get(id).length(), -1);
                   System.out.print(".");
                }
                normalMinusMap.put(id, tmpGraphs);
            }
            System.out.print("\n");
        }


        ////normalize
        if (!alreadyCached && Parameters.normPercentile > 0) {
            System.out.println("Normalizing Graph files...");
//			/*
            for (String id : ids)
                for (int i = 0; i < Parameters.numReplicates; i++)
                    XYnorm.percentileNormalize5primeAndNormalXYplusAndMinus(fivePrimePlusMap.get(id)[i], fivePrimeMinusMap.get(id)[i], normalPlusMap.get(id)[i], normalMinusMap.get(id)[i], Parameters.normPercentile);
            //*/

			/*
			for(String id : ids)
			{
				XYnorm.percentileNormalizeXYplusAndMinus(fivePrimePlusMap.get(id), fivePrimeMinusMap.get(id), Parameters.normPercentile);
				XYnorm.percentileNormalizeXYplusAndMinus(normalPlusMap.get(id), normalMinusMap.get(id), Parameters.normPercentile);
			}//*/
            // out.println("\t--");
        }

        ////normalize TEX

        //calculate enrichment percentiles
        if (!alreadyCached && Parameters.texNormPercentile > 0) {

            Map<String, double[]> enrichPercMap = new HashMap<String, double[]>();
            for (String id : ids) {
                enrichPercMap.put(id, new double[Parameters.numReplicates]);
            }
            for (String id : ids) {
                for (int i = 0; i < Parameters.numReplicates; i++) {
                    enrichPercMap.get(id)[i] = XYnorm.getEnrichmentFactorPercentile(fivePrimePlusMap.get(id)[i], normalPlusMap.get(id)[i], fivePrimeMinusMap.get(id)[i], normalMinusMap.get(id)[i], Parameters.texNormPercentile);
                }
            }
            //maximum
            double maxFactor = 0;
            for (String id : ids) {
                for (int i = 0; i < Parameters.numReplicates; i++)
                    maxFactor = Math.max(maxFactor, enrichPercMap.get(id)[i]);
            }

            //normalize
            for (String id : ids) {
                for (int i = 0; i < Parameters.numReplicates; i++) {
                    // out.println("\tEnrichfactor " + enrichPercMap.get(id)[i] / maxFactor);
                    XYnorm.factorNormalizeXY(normalPlusMap.get(id)[i], enrichPercMap.get(id)[i] / maxFactor);
                    XYnorm.factorNormalizeXY(normalMinusMap.get(id)[i], enrichPercMap.get(id)[i] / maxFactor);
                }
            }
        }

        ////write Graphs
        if (Config.getBoolean("writeGraphs")) {

             System.out.println("Writing Graph files...");

            //FivePrime fow
            System.out.println("\tfivePrimePlus");
            for (String id : ids) {
                for (int i = 0; i < Parameters.numReplicates; i++) {
                    XYio.writeXYfile(superG.superGenomifyXYtrack2trackMode(id, fivePrimePlusMap.get(id)[i], fivePrimeMinusMap.get(id)[i]), outDir + Config.getString("outputPrefix_" + id) + repIDs[i] + "_superFivePrimePlus.gr", "super");
                    XYio.writeXYfile(fivePrimePlusMap.get(id)[i], outDir + Config.getString("outputPrefix_" + id) + repIDs[i] + "_genomeFivePrimePlus.gr", Config.getString("outputPrefix_" + id));
                }
            }


            //Normal fow
            System.out.println("\tnormalPlus");
            for (String id : ids)
                for (int i = 0; i < Parameters.numReplicates; i++) {
                    XYio.writeXYfile(superG.superGenomifyXYtrack2trackMode(id, normalPlusMap.get(id)[i], normalMinusMap.get(id)[i]), outDir + Config.getString("outputPrefix_" + id) + repIDs[i] + "_superNormalPlus.gr", "super");
                    XYio.writeXYfile(normalPlusMap.get(id)[i], outDir + Config.getString("outputPrefix_" + id) + repIDs[i] + "_genomeNormalPlus.gr", Config.getString("outputPrefix_" + id));
                }

            //FivePrime revERROR_MESSAGE
            System.out.println("\tfivePrimeMinus");
            for (String id : ids)
                for (int i = 0; i < Parameters.numReplicates; i++) {
                    XYio.writeXYfile(superG.superGenomifyXYtrack2trackMode(id, fivePrimeMinusMap.get(id)[i], fivePrimePlusMap.get(id)[i]), outDir + Config.getString("outputPrefix_" + id) + repIDs[i] + "_superFivePrimeMinus.gr", "super");
                    XYio.writeXYfile(fivePrimeMinusMap.get(id)[i], outDir + Config.getString("outputPrefix_" + id) + repIDs[i] + "_genomeFivePrimeMinus.gr", Config.getString("outputPrefix_" + id));
                }

            //Normal rev
            System.out.println("\tnormalMinus");
            for (String id : ids)
                for (int i = 0; i < Parameters.numReplicates; i++) {
                    XYio.writeXYfile(superG.superGenomifyXYtrack2trackMode(id, normalMinusMap.get(id)[i], normalPlusMap.get(id)[i]), outDir + Config.getString("outputPrefix_" + id) + repIDs[i] + "_superNormalMinus.gr", "super");
                    XYio.writeXYfile(normalMinusMap.get(id)[i], outDir + Config.getString("outputPrefix_" + id) + repIDs[i] + "_genomeNormalMinus.gr", Config.getString("outputPrefix_" + id));
                }

        }
        ////write SuperGenomified annotations
        System.out.println("Writing SuperGenome annotations...");

        for (String id : ids) {
            //System.out.println("annoMap:" + annotationMap.get(id));
            GFFio.writeGFF(superG.superGenomifyGenes(id, annotationMap.get(id), true), outDir + Config.getString("outputPrefix_" + id) + "_super.gff");
        }
        ///

        BufferedWriter bw;

        ////write SuperGenome coordinate mapping
        if (Config.entryExists("writeCoordinateMapping") && Config.getBoolean("writeCoordinateMapping")) {
            // out.println("Writing SuperGenome coordinate mapping...");
            bw = new BufferedWriter(new FileWriter(outDir + "superCoordinates.tsv"));
            bw.append("SuperPos");
            for (String id : ids) {
                bw.append("\tPos_" + Config.getString("outputPrefix_" + id));
            }
            bw.append("\n");

            int[][] super2Gmap = superG.getSuper2GenomesAsArrayMap(ids);
            for (int i = 1; i < super2Gmap[0].length; i++) {
                bw.append(Integer.toString(i));
                for (int j = 0; j < super2Gmap.length; j++)
                    bw.append("\t" + super2Gmap[j][i]);
                bw.append("\n");
            }

            bw.close();

        }


        ////write aligned genome fasta
        System.out.println("Writing SuperGenome Sequences...");

        for (String id : ids) {
            bw = new BufferedWriter(new FileWriter(outDir + Config.getString("outputPrefix_" + id) + "_super.fa"));
            FASTAWriter.write(bw, "super", superG.superGenomifyFASTA(id, genomeMap.get(id)));
            bw.close();
        }

        bw = new BufferedWriter(new FileWriter(outDir + "superConsensus.fa"));
        FASTAWriter.write(bw, "super", superG.superGenomeConsensus(genomeMap));
        bw.close();

        ////TSS prediction
        System.out.println("Predicting TSS...");

        Map<String, List<TSS>> tssMap = new HashMap<String, List<TSS>>();
        List<TSS> tmpTssList;
        List<TSS>[] tmpRepLists = new List[Parameters.numReplicates];


        for (String id : ids) {
            //String fastaNames = contigHandlerMap.get(id).getFASTAentries().keySet().iterator().next();

            //String faID = contigHandlerMap.get(id).getFASTAentries().get(fastaNames);

            //System.out.println(fastaNames);
            for (int i = 0; i < Parameters.numReplicates; i++) {
                tmpRepLists[i] = TSSpredictor.predictTSS(fivePrimePlusMap.get(id)[i], normalPlusMap.get(id)[i], false);
                tmpRepLists[i].addAll(TSSpredictor.predictTSS(fivePrimeMinusMap.get(id)[i], normalMinusMap.get(id)[i], false));
                Collections.sort(tmpRepLists[i]);
            }
            tmpTssList = TSSsetComparator.compareReplicates(tmpRepLists);
            tssMap.put(id, tmpTssList);
        }

        List<TSS> superTSS = TSSsetComparator.compareDataSets(tssMap, superG);

        //write superTSS
        bw = new BufferedWriter(new FileWriter(outDir + "superTSS.gff"));

        bw.append("##gff-version 3\n");
        bw.append("##source-version TSS prediction\n");
        Date date = new Date();
        bw.write("##date " + date.toGMTString() + "\n");
        bw.write("##parameters " + TSSpredictor.getParameterString() + "\n");

        for (TSS tss : superTSS) {
            bw.write(tss.toGFFString("super"));
            bw.newLine();
        }
        bw.close();

        //track-wise
        bw = new BufferedWriter(new FileWriter(outDir + "superTSStracks.gff"));

        bw.append("##gff-version 3\n");
        bw.append("##source-version TSS prediction\n");
        date = new Date();
        bw.write("##date " + date.toGMTString() + "\n");
        bw.write("##parameters " + TSSpredictor.getParameterString() + "\n");

        for (TSS tss : superTSS) {
            for (String id : ids) {
                if (tss.isDetected(id)) {
                    bw.write(tss.toGFFtrackString("super", "super"));
                    bw.newLine();
                }
            }
        }
        bw.close();

        /////classify TSS
        System.out.println("Classifying TSS...");

        bw = new BufferedWriter(new FileWriter(outDir + "MasterTable.tsv"));

        //map superTSS back to the different genomes
        for (String id : ids) {
            tmpTssList = superG.genomifySuperTSS(id, superTSS);
            TSSclassifier.classifyTSS(tmpTssList, annotationMap.get(id));
            tssMap.put(id, tmpTssList);
        }

        String genomeCol = "Condition";
        if (Config.getString("mode").equalsIgnoreCase("align")) {
            genomeCol = "Genome";
        }

        if (printRepStats)
            bw.append("SuperPos\tSuperStrand\tmapCount\tdetCount\t").append(genomeCol).append("\tdetected\tenriched\tstepHeight\trepStepHeights\tstepFactor\trepStepFactors\tenrichmentFactor\trepEnrichmentFactors\tclassCount\tPos\tStrand\tLocus_tag\tsRNA/asRNA\tProduct\tUTRlength\tGeneLength\tPrimary\tSecondary\tInternal\tAntisense\tAntisenseOrientation\tAutomated\tManual\tPutative sRNA\tPutative asRNA\tComment\tSequence -50 nt upstream + TSS (51nt)\tcontigPos\tcontigID\n");
        else
            bw.append("SuperPos\tSuperStrand\tmapCount\tdetCount\t").append(genomeCol).append("\tdetected\tenriched\tstepHeight\tstepFactor\tenrichmentFactor\tclassCount\tPos\tStrand\tLocus_tag\tsRNA/asRNA\tProduct\tUTRlength\tGeneLength\tPrimary\tSecondary\tInternal\tAntisense\tAntisenseOrientation\tAutomated\tManual\tPutative sRNA\tPutative asRNA\tComment\tSequence -50 nt upstream + TSS (51nt)\tcontigPos\tcontigID\n");

        //write very big classification table
        TSS gTSS;
        TSS tmpTSS;
        String superProps;
        String genomeProps;
        String moreProps;

        String tmpHeight;
        String tmpCFactor;
        String tmpEFactor;

        //replicate specific stats
        String tmpRepHeights = "";
        String tmpRepCFactors = "";
        String tmpRepEFactors = "";

        double scale = 1;
        if (XYnorm.minNormValue != Integer.MAX_VALUE)
            scale = XYnorm.minNormValue;

        for (TSS suTSS : superTSS) {
            //for each genome...
            for (String id : ids) {
                /* Before retrieving the index from the fastaEntries,
                   we have to make sure, that the order of the fasta entries remain
                   conservered while iterating. As the return value of HashMap keyValues() is
                   a Set, this can not be guaranteed. So we iterate through the FASTA entries
                   hashmap, which is a order preserving LinkedHashMap and save the entries in
                   an ArrayList, where order is conserved.*/
                ArrayList<String> fastaIDList = new ArrayList<>();
                contigHandlerMap.get(id).getFASTAentries().forEach((String fastaID, String sequence) ->
                        fastaIDList.add(fastaID));


                //get genome TSS for superTSS
                gTSS = null;
                tmpTSS = superG.genomifySuperTSS(id, suTSS);
                if (tmpTSS == null)
                    continue;
                for (TSS t : tssMap.get(id)) {
                    if (t.getStrand() == tmpTSS.getStrand() && t.getPos() == tmpTSS.getPos()) {
                        gTSS = t;
                        break;
                    }
                }

                //if a detected TSS is not mappable
                if (suTSS.isDetected(id) && gTSS == null) {
                   // System.out.println(suTSS.getPosHashString() + id);
                    gTSS = suTSS.getGenomicTSS(id);
                    TSSclassifier.classifyTSS(gTSS, annotationMap.get(id));
                }

                //no mapping?
                if (gTSS == null)
                    continue;

                //get properties
                superProps = suTSS.getPos() + "\t" + suTSS.getStrand() + "\t" + suTSS.getMappingSet().size() + "\t" + suTSS.getNumOfNotProcessedDetections() + "\t";

                if (suTSS.isDetected(id)) {
                    tmpHeight = Double.toString(Math.round(suTSS.getGenomicTSS(id).getHeight() * scale * 100) / 100d);

                    if (suTSS.getGenomicTSS(id).getCliffFactor() > 100)
                        tmpCFactor = ">100";
                    else
                        tmpCFactor = Double.toString(Math.round(suTSS.getGenomicTSS(id).getCliffFactor() * 100) / 100d);

                    if (suTSS.getGenomicTSS(id).getEnrichFactor() > 100)
                        tmpEFactor = ">100";
                    else
                        tmpEFactor = Double.toString(Math.round(suTSS.getGenomicTSS(id).getEnrichFactor() * 100) / 100d);

                    //replicate specific stats
                    if (printRepStats) {
                        tmpRepHeights = "\t";

                        double tmpNum = suTSS.getGenomicTSS(id).repHeights[0] * scale;
                        if(!Double.isInfinite(tmpNum)) {
                            tmpNum = Math.round(tmpNum * 1000.0) / 1000.0;
                        }
                        tmpRepHeights =  tmpRepHeights + tmpNum;//(suTSS.getGenomicTSS(id).repHeights[0] * scale);
                        for (int i = 1; i < Parameters.numReplicates; i++) {
                            tmpNum = (suTSS.getGenomicTSS(id).repHeights[i] * scale);
                            if(!Double.isInfinite(tmpNum)) {
                                tmpNum = Math.round(tmpNum * 1000.0) / 1000.0;
                            }
                            tmpRepHeights = tmpRepHeights + "/" + tmpNum;//(suTSS.getGenomicTSS(id).repHeights[i] * scale);
                        }
                        tmpRepCFactors = "\t";
                        tmpNum = suTSS.getGenomicTSS(id).repStepFactors[0];
                        if(!Double.isInfinite(tmpNum)) {
                            tmpNum = Math.round(tmpNum * 1000.0) / 1000.0;
                        }
                        tmpRepCFactors = tmpRepCFactors + tmpNum; //suTSS.getGenomicTSS(id).repStepFactors[0];
                        for (int i = 1; i < Parameters.numReplicates; i++) {
                            tmpNum = suTSS.getGenomicTSS(id).repStepFactors[i];
                            if(!Double.isInfinite(tmpNum)) {
                                tmpNum = Math.round(tmpNum * 1000.0) / 1000.0;
                            }
                            tmpRepCFactors = tmpRepCFactors + "/" + tmpNum;//suTSS.getGenomicTSS(id).repStepFactors[i];
                        }
                        tmpRepEFactors = "\t";
                        tmpNum = suTSS.getGenomicTSS(id).repEnrich[0];
                        if(!Double.isInfinite(tmpNum)) {
                            tmpNum = Math.round(tmpNum * 1000.0) / 1000.0;
                        }
                        tmpRepEFactors = tmpRepEFactors + tmpNum;//suTSS.getGenomicTSS(id).repEnrich[0];
                        for (int i = 1; i < Parameters.numReplicates; i++) {
                            tmpNum = suTSS.getGenomicTSS(id).repEnrich[i];
                            if(!Double.isInfinite(tmpNum)) {
                                tmpNum = Math.round(tmpNum * 1000.0) / 1000.0;
                            }
                            tmpRepEFactors = tmpRepEFactors + "/" + tmpNum;//suTSS.getGenomicTSS(id).repEnrich[i];
                        }

                        tmpHeight = tmpHeight + tmpRepHeights;
                        tmpCFactor = tmpCFactor + tmpRepCFactors;
                        tmpEFactor = tmpEFactor + tmpRepEFactors;
                    }
                } else {
                    tmpHeight = "NA";//Double.toString(Double.NaN);
                    tmpCFactor = "NA";//Double.toString(Double.NaN);
                    tmpEFactor = "NA";//Double.toString(Double.NaN);

                    //replicate specific stats
                    if (printRepStats) {
                        tmpHeight = "NA\t";//Double.toString(Double.NaN);
                        tmpCFactor = "NA\t";//Double.toString(Double.NaN);
                        tmpEFactor = "NA\t";//Double.toString(Double.NaN);
                    }

                }
                genomeProps = Config.getString("outputPrefix_" + id) + "\t" + i(suTSS.isDetected(id) && !suTSS.isProcessed(id)) + "\t" + i(suTSS.isEnriched(id)) + "\t" + tmpHeight + "\t" + tmpCFactor + "\t" + tmpEFactor + "\t" + gTSS.getNumClasses() + "\t" + gTSS.getPos() + "\t" + gTSS.getStrand() + "\t";
                moreProps = "1\t0\t0\t" + i(gTSS.isAntisense()) + "\t \t" + gTSS.getSequence(genomeMap.get(id), 50, 0) + "\t";


				/*
				Map the position back to the respective contig
				position and contigID and print both in the MasterTable.tsv
				 */
                // Get the contig position
                int contigPosition = contigHandlerMap.get(id).getSuperContigMap().get((gTSS.getPos() - 1) * 2);
                // Get the contig ID index
                int contigIDindex = contigHandlerMap.get(id).getSuperContigMap().get((gTSS.getPos() - 1) * 2 + 1);

                // Now we can request the FASTA ID from the list, via the index in the SuperContigMap.
                String contigID = fastaIDList.get(contigIDindex);
                //String contigInfo = String.format("%s\t%s|%s\n", contigPosition, DEFAULT_SEQUENCE_IDENTIFIER.toString().toLowerCase() ,contigID);
                String contigInfo = String.format("%s\t%s|%s\n", contigPosition, DEFAULT_SEQUENCE_IDENTIFIER.get(id), contigID);
                //System.out.println("contigID" + contigID);

                //tss classes

                //UTR?
                if (gTSS.isPrimary() &&
                        gTSS.getPrimaryOrSecondaryState().closestGeneOnSameContig(fastaIDList, contigHandlerMap.get(id)))
                    bw.append(superProps + genomeProps + gTSS.getUTRgene().getId() + "\t" + gTSS.getUTRgene().get_sRNA_asRNA_labelIfContainedInSet(sRNAnameMap.get(id), asRNAnameMap.get(id)) + "\t" + gTSS.getUTRgene().getDescription() + "\t" + gTSS.utrDistanceTo(gTSS.getUTRgene()) + "\t" + gTSS.getUTRgene().getLength() + "\t" + "1\t0\t0\t0\t" + "NA\t" + moreProps + contigInfo);

                if (gTSS.isSecondary() &&
                        gTSS.getPrimaryOrSecondaryState().closestGeneOnSameContig(fastaIDList, contigHandlerMap.get(id)))
                    bw.append(superProps + genomeProps + gTSS.getUTRgene().getId() + "\t" + gTSS.getUTRgene().get_sRNA_asRNA_labelIfContainedInSet(sRNAnameMap.get(id), asRNAnameMap.get(id)) + "\t" + gTSS.getUTRgene().getDescription() + "\t" + gTSS.utrDistanceTo(gTSS.getUTRgene()) + "\t" + gTSS.getUTRgene().getLength() + "\t" + "0\t1\t0\t0\t" + "NA\t" + moreProps + contigInfo);

                //internal
                if (gTSS.isInternal())
                    for (Gene g : gTSS.getInternalGenes())
                        bw.append(superProps + genomeProps + g.getId() + "\t" + g.get_sRNA_asRNA_labelIfContainedInSet(sRNAnameMap.get(id), asRNAnameMap.get(id)) + "\t" + g.getDescription() + "\t" + "NA" + "\t" + g.getLength() + "\t" + "0\t0\t1\t0\t" + "NA\t" + moreProps + contigInfo);

                //antisense
                if (gTSS.isAntisense()) {
                    int antisenseGeneIndex = 0;
                    for (Gene g : gTSS.getAntisenseGenes()) {
                        if (gTSS.getAntisenseState().closestGeneOnSameContig(fastaIDList, contigHandlerMap.get(id), antisenseGeneIndex)) {
                            bw.append(superProps + genomeProps + g.getId() + "\t" + g.get_sRNA_asRNA_labelIfContainedInSet(sRNAnameMap.get(id), asRNAnameMap.get(id)) + "\t" + g.getDescription() + "\t" + "NA" + "\t" + g.getLength() + "\t" + "0\t0\t0\t1\t" + gTSS.getAntisenseOrientation() + "\t" + moreProps + contigInfo);
                        }
                    }
                }

                if (!(gTSS.isPrimary() || gTSS.isSecondary() || gTSS.isInternal() || gTSS.isAntisense()))
                    bw.append(superProps + genomeProps + "orphan" + "\t" + "\t" + "orphan" + "\t" + "NA" + "\t" + "NA" + "\t" + "0\t0\t0\t0\t" + gTSS.getAntisenseOrientation() + "\t" + moreProps + contigInfo);
            }
        }

        bw.close();

        //write genomeTSS.gff
        System.out.println("Writing genome-wise TSS results...");

        for (String id : ids) {
            bw = new BufferedWriter(new FileWriter(outDir + Config.getString("outputPrefix_" + id) + "_TSS.gff"));
            bw.append("##gff-version 3\n");
            bw.append("##source-version TSS prediction\n");
            date = new Date();
            bw.write("##date " + date.toGMTString() + "\n");
            bw.write("##parameters " + TSSpredictor.getParameterString() + "\n");


            ArrayList<String> fastaIDList = new ArrayList<>();
            contigHandlerMap.get(id).getFASTAentries().forEach((String fastaID, String sequence) ->
                    fastaIDList.add(fastaID));

            for (TSS tss : superTSS) {
                if (tss.isMapped(id) && tss.isDetected(id) && tss.isEnriched(id)) {
                    gTSS = superG.genomifySuperTSS(id, tss);
                    if (gTSS == null)
                        gTSS = tss.getGenomicTSS(id);

                    // Get the contig ID index
                    int contigIDindex = contigHandlerMap.get(id).getSuperContigMap().get((gTSS.getPos() - 1) * 2 + 1);

                    // Now we can request the FASTA ID from the list, via the index in the SuperContigMap.
                    String contigID = fastaIDList.get(contigIDindex);

                    //System.out.println("contigID: " + contigID);

                    bw.append(gTSS.toGFFString(contigID));

                    bw.newLine();
                }
            }
            bw.close();
        }


        /////statistics
        System.out.println("Calculating statistics...");

        bw = new BufferedWriter(new FileWriter(outDir + "TSSstatistics.tsv"));

        bw.append("TSS prediction statistics:\tComplete\tUTR\tInternal\tAntisense\tOrphan\n");

        boolean countPrime = false;
        boolean countSec = false;
        boolean countInternal = false;
        boolean countAS = false;
        boolean countOrphan = false;

        Map<String, int[]> generalCountMap = new HashMap<String, int[]>();
        generalCountMap.put("all", new int[6]);
        generalCountMap.put("inAll", new int[6]);
        generalCountMap.put("inSome", new int[6]);

        Map<String, int[]> inGenomeCountMap = new HashMap<String, int[]>();
        for (String id : ids)
            inGenomeCountMap.put(id, new int[6]);

        Map<String, int[]> onlyInGenomeCountMap = new HashMap<String, int[]>();
        for (String id : ids)
            onlyInGenomeCountMap.put(id, new int[6]);

        Map<String, int[]> missingInGenomeCountMap = new HashMap<String, int[]>();
        for (String id : ids)
            missingInGenomeCountMap.put(id, new int[6]);

        //count!

        for (TSS suTSS : superTSS) {
            countPrime = false;
            countSec = false;
            countInternal = false;
            countAS = false;
            countOrphan = false;

            //for each genome...
            for (String id : ids) {
                //get genome TSS for superTSS
                gTSS = null;
                tmpTSS = superG.genomifySuperTSS(id, suTSS);
                if (tmpTSS == null)
                    continue;
                for (TSS t : tssMap.get(id)) {
                    if (t.getStrand() == tmpTSS.getStrand() && t.getPos() == tmpTSS.getPos()) {
                        gTSS = t;
                        break;
                    }
                }

                //if a detected TSS is not mappable
                if (suTSS.isDetected(id) && gTSS == null) {
                    gTSS = suTSS.getGenomicTSS(id);
                    TSSclassifier.classifyTSS(gTSS, annotationMap.get(id));
                }

                //no mapping?
                if (gTSS == null)
                    continue;

                //detected in this genome?
                if (suTSS.isDetected(id) && !suTSS.isProcessed(id))
                    inGenomeCountMap.get(id)[0]++;
                else
                    continue;

                //only in this genome?
                if (suTSS.isDetected(id) && !suTSS.isProcessed(id) && suTSS.getNumOfNotProcessedDetections() == 1)
                    onlyInGenomeCountMap.get(id)[0]++;

                //Primary
                if (gTSS.isPrimary()) {
                    countPrime = true;

                    //genome specific:
                    if (suTSS.isDetected(id) && !suTSS.isProcessed(id))
                        inGenomeCountMap.get(id)[1]++;
                    if (suTSS.isDetected(id) && !suTSS.isProcessed(id) && suTSS.getNumOfNotProcessedDetections() == 1)
                        onlyInGenomeCountMap.get(id)[1]++;
                }

                //Secondary
                if (gTSS.isSecondary()) {
                    countSec = true;

                    //genome specific:
                    if (suTSS.isDetected(id) && !suTSS.isProcessed(id))
                        inGenomeCountMap.get(id)[2]++;
                    if (suTSS.isDetected(id) && !suTSS.isProcessed(id) && suTSS.getNumOfNotProcessedDetections() == 1)
                        onlyInGenomeCountMap.get(id)[2]++;
                }

                //internal
                if (gTSS.isInternal()) {
                    countInternal = true;

                    //genome specific:
                    if (suTSS.isDetected(id) && !suTSS.isProcessed(id))
                        inGenomeCountMap.get(id)[3]++;
                    if (suTSS.isDetected(id) && !suTSS.isProcessed(id) && suTSS.getNumOfNotProcessedDetections() == 1)
                        onlyInGenomeCountMap.get(id)[3]++;
                }

                //antisense
                if (gTSS.isAntisense()) {
                    countAS = true;

                    //genome specific:
                    if (suTSS.isDetected(id) && !suTSS.isProcessed(id))
                        inGenomeCountMap.get(id)[4]++;
                    if (suTSS.isDetected(id) && !suTSS.isProcessed(id) && suTSS.getNumOfNotProcessedDetections() == 1)
                        onlyInGenomeCountMap.get(id)[4]++;
                }

                //orphan
                if (!(gTSS.isPrimary() || gTSS.isSecondary() || gTSS.isInternal() || gTSS.isAntisense())) {
                    countOrphan = true;

                    //genome specific:
                    if (suTSS.isDetected(id) && !suTSS.isProcessed(id))
                        inGenomeCountMap.get(id)[5]++;
                    if (suTSS.isDetected(id) && !suTSS.isProcessed(id) && suTSS.getNumOfNotProcessedDetections() == 1)
                        onlyInGenomeCountMap.get(id)[5]++;
                }
            }


            for (int c = 0; c < 6; c++) {
                //always process if c=0
                if (c == 1 && !countPrime) continue;
                if (c == 2 && !countSec) continue;
                if (c == 3 && !countInternal) continue;
                if (c == 4 && !countAS) continue;
                if (c == 5 && !countOrphan) continue;

                generalCountMap.get("all")[c]++;
                if (suTSS.getNumOfNotProcessedDetections() == ids.length)
                    generalCountMap.get("inAll")[c]++;
                if (suTSS.getNumOfNotProcessedDetections() > 1 && suTSS.getNumOfNotProcessedDetections() < ids.length)
                    generalCountMap.get("inSome")[c]++;
                for (String id : ids) {
                    if (!(suTSS.isDetected(id) && !suTSS.isProcessed(id)) && suTSS.getNumOfNotProcessedDetections() == ids.length - 1)
                        missingInGenomeCountMap.get(id)[c]++;
                }
            }
        }

        //write statistics
        int[] tmp;

        bw = new BufferedWriter(new FileWriter(outDir + "TSSstatistics.tsv"));
        bw.append("TSS prediction statistics:\tAll\tPrimary\tSecondary\tInternal\tAntisense\tOrphan\n\n");

        tmp = generalCountMap.get("all");
        bw.append("Complete number of detected TSS:");
        bw.append("\t" + tmp[0]);
        for (int i = 1; i < tmp.length; i++)
            bw.append("\t" + tmp[i] + "(" + Math.round(tmp[i] * 100 / (double) tmp[0]) + "%)");
        bw.newLine();

        tmp = generalCountMap.get("inAll");
        bw.append("Number of TSS detected in all strains/conditions:");
        bw.append("\t" + tmp[0]);
        for (int i = 1; i < tmp.length; i++)
            bw.append("\t" + tmp[i] + "(" + Math.round(tmp[i] * 100 / (double) tmp[0]) + "%)");
        bw.newLine();

        tmp = generalCountMap.get("inSome");
        bw.append("Number of TSS detected in at least 2 but not all strains/conditions:");
        bw.append("\t" + tmp[0]);
        for (int i = 1; i < tmp.length; i++)
            bw.append("\t" + tmp[i] + "(" + Math.round(tmp[i] * 100 / (double) tmp[0]) + "%)");
        bw.newLine();
        bw.newLine();

        for (String id : ids) {
            tmp = inGenomeCountMap.get(id);
            bw.append("Number of TSS detected in " + Config.getString("outputPrefix_" + id) + ":");
            bw.append("\t" + tmp[0]);
            for (int i = 1; i < tmp.length; i++)
                bw.append("\t" + tmp[i] + "(" + Math.round(tmp[i] * 100 / (double) tmp[0]) + "%)");
            bw.newLine();
        }
        bw.newLine();

        for (String id : ids) {
            tmp = onlyInGenomeCountMap.get(id);
            bw.append("Number of TSS only detected in " + Config.getString("outputPrefix_" + id) + ":");
            bw.append("\t" + tmp[0]);
            for (int i = 1; i < tmp.length; i++)
                bw.append("\t" + tmp[i] + "(" + Math.round(tmp[i] * 100 / (double) tmp[0]) + "%)");
            bw.newLine();
        }
        bw.newLine();

        for (String id : ids) {
            tmp = missingInGenomeCountMap.get(id);
            bw.append("Number of TSS only missing in " + Config.getString("outputPrefix_" + id) + ":");
            bw.append("\t" + tmp[0]);
            for (int i = 1; i < tmp.length; i++)
                bw.append("\t" + tmp[i] + "(" + Math.round(tmp[i] * 100 / (double) tmp[0]) + "%)");
            bw.newLine();
        }
        bw.newLine();


        bw.close();


        //alignment statistics
        bw = new BufferedWriter(new FileWriter(outDir + "AlignmentStatistics.tsv"));
        bw.append("Alignment statistics:\n\n");
        bw.append("Alignment length:\t\t" + superG.getAlignmentLength() + " columns\n");
        bw.append("Perfectly matching columns:\t" + superG.getPerfectColCount() + "\n\n");

        bw.append("Strain\tInsertions(nt)\tDeletions(nt)\n");
        for (String id : ids)
            bw.append(Config.getString("outputPrefix_" + id) + "\t" + superG.getInsCountMap().get(id) + "\t" + superG.getDelCountMap().get(id) + "\n");

        bw.close();


        //nocoRNAc - TSS as siddSites
        if (Parameters.writeNocornacFiles) {
            for (String id : ids) {
                bw = new BufferedWriter(new FileWriter(outDir + Config.getString("outputPrefix_" + id) + "_as-siddSites.out"));

                date = new Date();
                bw.write("##date " + date.toGMTString() + "\n");
                bw.write("##parameters " + TSSpredictor.getParameterString() + "\n");

                gTSS = null;
                for (TSS tss : superTSS) {
                    if (!tss.isDetected(id) || tss.isProcessed(id))
                        continue;
                    gTSS = superG.genomifySuperTSS(id, tss);
                    if (gTSS == null)
                        gTSS = tss.getGenomicTSS(id);

                    bw.write("TSS" + tss.getPos() + "\t" + gTSS.getPos() + "\t" + gTSS.getPos() + "\t" + gTSS.getStrand() + "\t" + "-10.0");
                    bw.newLine();
                }

                bw.close();
            }

            //also for SuperGenome
            bw = new BufferedWriter(new FileWriter(outDir + "superTSS" + "_as-siddSites.out"));

            date = new Date();
            bw.write("##date " + date.toGMTString() + "\n");
            bw.write("##parameters " + TSSpredictor.getParameterString() + "\n");

            for (TSS tss : superTSS) {
                bw.write("TSS" + tss.getPos() + "\t" + tss.getPos() + "\t" + tss.getPos() + "\t" + tss.getStrand() + "\t" + "-10.0");
                bw.newLine();
            }

            bw.close();


            //nocoRNAc - TSS as loci
            int regionLength = 100;

            for (String id : ids) {
                bw = new BufferedWriter(new FileWriter(outDir + Config.getString("outputPrefix_" + id) + "_as-ncRNA-loci.gff"));

                bw.append("##gff-version 3\n");
                bw.append("##source-version TSS prediction\n");
                date = new Date();
                bw.write("##date " + date.toGMTString() + "\n");
                bw.write("##parameters " + TSSpredictor.getParameterString() + "\n");

                String posstring;
                gTSS = null;
                for (TSS tss : superTSS) {
                    if (!tss.isDetected(id) || tss.isProcessed(id))
                        continue;
                    gTSS = superG.genomifySuperTSS(id, tss);
                    if (gTSS == null)
                        gTSS = tss.getGenomicTSS(id);

                    if (gTSS.getStrand() == '-')
                        posstring = (gTSS.getPos() - regionLength + 1) + "\t" + gTSS.getPos();
                    else
                        posstring = gTSS.getPos() + "\t" + (gTSS.getPos() + regionLength - 1);

                    bw.write(Config.getString("outputPrefix_" + id) + "\ttssprediction\tTSS\t" + posstring + "\t.\t" + gTSS.getStrand() + "\t." + "\t" + "ID=" + "TSS" + tss.getPosHashString());
                    bw.newLine();
                }

                bw.close();
            }

            //also for SuperGenome
            bw = new BufferedWriter(new FileWriter(outDir + "superTSS" + "_as-ncRNA-loci.gff"));

            bw.append("##gff-version 3\n");
            bw.append("##source-version TSS prediction\n");
            date = new Date();
            bw.write("##date " + date.toGMTString() + "\n");
            bw.write("##parameters " + TSSpredictor.getParameterString() + "\n");

            String posstring;
            for (TSS tss : superTSS) {
                if (tss.getStrand() == '-')
                    posstring = (tss.getPos() - regionLength + 1) + "\t" + tss.getPos();
                else
                    posstring = tss.getPos() + "\t" + (tss.getPos() + regionLength - 1);

                bw.write("super" + "\ttssprediction\tTSS\t" + posstring + "\t.\t" + tss.getStrand() + "\t." + "\t" + "ID=" + "TSS" + tss.getPosHashString());
                bw.newLine();
            }

            bw.close();
        }



        //generate Expression Matrix using SuperGenes
        List<SuperGene> suGenes;
        Map<String, Gene> regions;
        Gene tmpRegion;


        //generate Expression Matrix using ortholog mapping
        if (Config.entryExists("orthologMapping")) {
            System.out.println("Calculating Expression Matrix from Orthologs...");

            bw = new BufferedWriter(new FileWriter(outDir + "expression_orthologs.tsv"));

            //header
            for (String id : ids) {
                for (int i = 0; i < Parameters.numReplicates; i++)
                    bw.write(Config.getString("outputPrefix_" + id) + "_" + repIDs[i] + "\t");
            }
            for (String id : ids) {
                bw.write(Config.getString("outputPrefix_" + id) + "_locusTag\t");
            }
            for (String id : ids) {
                bw.write(Config.getString("outputPrefix_" + id) + "_Product\t");
            }
            bw.write("detCount\t");

            bw.write("lengthProblem\t");

            bw.newLine();

            //get SuperGenes
            suGenes = SuperGeneFactory.createSuperGenesFromKonradsOrthologMapping(annotationMap, superG, Config.getString("orthologMapping"));

            Collections.sort(suGenes);

            for (SuperGene suG : suGenes) {
                regions = suG.getInterrogatableRegions();

                //no regions in this SuperGene?
                if (regions == null) {
                    //System.err.println("Warning: No interrogatable regions in a SuperGene!");
                    continue;
                }

                //ID
                bw.append(suG.getContentHashString() + "\t");

                //write expression
                for (String id : ids) {
                    tmpRegion = regions.get(id);

                    for (int i = 0; i < Parameters.numReplicates; i++) {
                        if (tmpRegion == null) {
                            bw.append("NA\t");
                            continue;
                        }
                        if (tmpRegion.getStrand() == '+')
                            bw.append(XYtools.getRegionMean(tmpRegion.getStart(), tmpRegion.getEnd(), normalPlusMap.get(id)[i]) + "\t");
                        else
                            bw.append(XYtools.getRegionMean(tmpRegion.getStart(), tmpRegion.getEnd(), normalMinusMap.get(id)[i]) + "\t");
                    }
                }

                //write locus tags
                for (String id : ids) {
                    tmpRegion = regions.get(id);
                    if (tmpRegion != null)
                        bw.append(tmpRegion.getId());
                    else
                        bw.append("-");

                    bw.append("\t");
                }

                //write products
                for (String id : ids) {
                    tmpRegion = regions.get(id);
                    if (tmpRegion != null)
                        bw.append(tmpRegion.getDescription());
                    else
                        bw.append("-");

                    bw.append("\t");
                }

                //detCount
                bw.append(Integer.toString(regions.size()) + "\t");

                //lengthProblem
                bw.append(Integer.toString(i(suG.hasLengthProblem())));

                bw.newLine();
            }

            bw.close();
        }

        double timeTaken = (System.currentTimeMillis() - timeStart) / 1000d;
        System.out.println("All done! " + timeTaken + " s" + "\n\n\n");
    }

    public static void ringMode() throws Exception {
        //IDs
        String[] ids = Config.getString("idList").split(",");

        if (ids.length != Config.getInt("numberOfDatasets"))
            throw new Error("numberOfDatasets does not match length of idList!");

        //output
        String outDir = Config.getString("outputDirectory");

        //read alignment
        //System.out.println("Reading alignment blocks...");
        List<XmfaBlock> alignmentBlocks = XmfaParser.parseXmfa(Config.getString("xmfa"));

        //SuperGenome
        //System.out.println("Building SuperGenome...");
        SuperGenome superG = new SuperGenome(alignmentBlocks, ids);


        GenomeRingBlocker grb = new GenomeRingBlocker(superG.getRefBlocks(), ids);

        //BlockMap
        BufferedWriter bw = new BufferedWriter(new FileWriter(outDir + "blocks.out"));

        List<int[]> blockPositions = new LinkedList<int[]>();
        List<int[]> tmpPos;
        int tmpStart;

        int lengthCount = 0;

        for (XmfaBlock b : grb.newBlockList) {
            tmpStart = superG.superGenomifyXmfaStart(b);

            tmpPos = b.getSubBlockPositions();
            for (int[] posPair : tmpPos) {
                posPair[0] = posPair[0] + tmpStart;
                posPair[1] = posPair[1] + tmpStart;

                lengthCount += posPair[1] - posPair[0] + 1;
            }

            blockPositions.addAll(tmpPos);
        }

        boolean first = true;
        for (int[] posPair : blockPositions) {
            if (first)
                first = false;
            else
                bw.append(",");

            bw.append(posPair[0] + "-" + posPair[1]);
        }
        bw.newLine();

        for (String id : ids) {
            bw.append(Config.getString("outputPrefix_" + id) + "\t");
            first = true;
            for (Integer i : grb.getGenomeBlockLists().get(id)) {
                if (first)
                    first = false;
                else
                    bw.append(",");

                bw.append(Integer.toString(i) + ":" + Math.abs(superG.getNextMappingPosInGenome(id, blockPositions.get(Math.abs(i) - 1)[0])) + "-" + Math.abs(superG.getNextMappingPosInGenome(id, blockPositions.get(Math.abs(i) - 1)[1])));
            }
            bw.newLine();
        }

        //System.out.println(lengthCount + " of " + superG.getAlignmentLength() + " alignment positions covered (~" + Math.round(((double) lengthCount * 100) / superG.getAlignmentLength()) + "%).");

        bw.close();
    }

    public static int i(boolean b) {
        if (b)
            return (1);
        return (0);
    }

    public String setNamesAndIDsFromXMFA(String filename) {

        try {
            Map<String, String> nameMap = new HashMap<String, String>();
            BufferedReader br = new BufferedReader(new FileReader(filename));

            int i = 1;
            String[] fields;
            for (String line = br.readLine(); line != null; line = br.readLine()) {
                line = line.trim();

                if (line.length() == 0)
                    continue;

                //header finished
                if (line.startsWith(">"))
                    break;

                //entry
                if (line.startsWith("#Sequence" + i + "File")) {
                    fields = line.split("\t");

                    if (fields.length < 2) {
                        System.err.println("The header of the alignment file is missing or not in proper format (Mauve xmfa format).\nGenome names and alignment IDs cannot be parsed from the file.\nPlease set them manually.");
                    }

                    fields = fields[1].split("/|\\\\");
                    nameMap.put(Integer.toString(i++), fields[fields.length - 1]);
                }
            }

            br.close();

            //no entries
            if (nameMap.size() == 0) {
                return "The header of the alignment file is missing or not in proper format (Mauve xmfa format).\nGenome names and alignment IDs cannot be parsed from the file.\nPlease set them manually.";
            }

            //set values
            String jsonString = "{";
            for (int j = 0; j < nameMap.size(); j++) {
                jsonString += "\"genome_" + (j+1) + "\": \"" + nameMap.get(Integer.toString(j + 1)) + "\",";
                jsonString += "\"id_" + (j+1) + "\": \"" + Integer.toString(j+1) + "\",";
            }

            jsonString = jsonString.substring(0, jsonString.length() - 1);
            jsonString += "}";
            return jsonString;

        } catch (Throwable t) {
            return "ERROR: An error occured while parsing the alignment file:\n" + t.getMessage();
        }

    }
}
