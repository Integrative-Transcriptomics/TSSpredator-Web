
package supergenome;

import genomic.Gene;

import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import main.Config;
import main.Main;
import main.Parameters;
import tss.TSS;


public class SuperGenome {
    private Map<String, int[]> fromSuperGenome;
    private Map<String, int[]> toSuperGenome;
    private List<XmfaBlock> blocks;
    private List<XmfaBlock> refBlocks;

    private int perfectColCount;
    private Map<String, Integer> delCountMap;
    private Map<String, Integer> insCountMap;

    private String[] refGenome;

    public SuperGenome(List<XmfaBlock> blocks, String[] refGenome) {
        fromSuperGenome = new HashMap<String, int[]>();
        toSuperGenome = new HashMap<String, int[]>();
        this.blocks = blocks;
        this.refGenome = refGenome;
        refBlocks = new LinkedList<XmfaBlock>();

        perfectColCount = 0;
        delCountMap = new HashMap<String, Integer>();
        insCountMap = new HashMap<String, Integer>();

        createPositionMap();
    }

    public SuperGenome(int length, String[] refGenome) {
        fromSuperGenome = new HashMap<String, int[]>();
        toSuperGenome = new HashMap<String, int[]>();

        this.refGenome = refGenome;


        perfectColCount = length;
        delCountMap = new HashMap<String, Integer>();
        insCountMap = new HashMap<String, Integer>();

        //fill the maps
        int[] tmp;
        for (String s : refGenome) {
            delCountMap.put(s, 0);
            insCountMap.put(s, 0);

            tmp = new int[length + 1];
            for (int i = 0; i < tmp.length; i++) {
                tmp[i] = i;
                //this is correct since the array has to be 1 field longer
                //to make it 1-based and a '0' is written in the first field,
                //which is never used (I think...)
            }

            fromSuperGenome.put(s, tmp);
            toSuperGenome.put(s, tmp);
        }
    }

    private void createPositionMap() {
        Map<String, Integer> lengthMap = new HashMap<String, Integer>();

        //get number and length of genomes and SuperGenome length
        int superGenomeLength = 0;
        for (XmfaBlock b : blocks) {
            for (XmfaSequence s : b.getSeqs().values()) {
                if (!lengthMap.containsKey(s.getSourceId()))
                    lengthMap.put(s.getSourceId(), s.getEnd());
                else
                    lengthMap.put(s.getSourceId(), Math.max(lengthMap.get(s.getSourceId()), s.getEnd()));
            }

            superGenomeLength += b.getBlockLength();
        }

        //select and sort reference blocks
        //Main.out.println("\tSort blocks...");
        for (XmfaBlock b : blocks)
            refBlocks.add(b);

        //old sorting
//		
//		BlockComparator refComp = new BlockComparator(refGenome);
//		
//		Collections.sort(refBlocks, refComp);

        //new sorting
        refBlocks = sortBlocks(refBlocks, refGenome);

        //initialize Mapping

        for (String s : lengthMap.keySet()) {
            toSuperGenome.put(s, new int[lengthMap.get(s) + 1]); //make array one base longer (1based)
            fromSuperGenome.put(s, new int[superGenomeLength + 1]); //make array one base longer (1based)
        }

        //initialize statistics
        for (String s : lengthMap.keySet()) {
            insCountMap.put(s, 0);
            delCountMap.put(s, 0);
        }

        //create Mapping blockwise in correct order
        int superGenomePos = 1;
        int tmpStrandFactor;

        char tmpChar;
        char tmpColChar = '$';
        boolean perfectCol;
        Set<String> hasGapSet = new HashSet<String>();

        //Main.out.println("\tProcessing SuperGenome positions...");
        for (XmfaBlock b : refBlocks) {
            int length = b.getBlockLength();
            Map<String, XmfaSequence> seqs = b.getSeqs();

            //start indices for processing
            Map<String, Integer> indices = new HashMap<String, Integer>();
            for (XmfaSequence s : seqs.values()) {
                if (s.getStrand() == '+')
                    indices.put(s.getSourceId(), s.getStart());
                else
                    indices.put(s.getSourceId(), s.getEnd());
            }

            //direction of incrementation
            Map<String, Integer> nextValue = new HashMap<String, Integer>();
            for (XmfaSequence s : seqs.values()) {
                if (s.getStrand() == '+')
                    nextValue.put(s.getSourceId(), 1);
                else
                    nextValue.put(s.getSourceId(), -1);
            }

            //do mapping
            //Main.out.println("\nNew Block");
            for (int posToProcess = 0; posToProcess < length; posToProcess++, superGenomePos++) {
                if (superGenomePos % 500000 == 0)
                    //Main.out.print("\n\t\t"+superGenomePos/1000+" kb processed   ");

                    //statistics
                    tmpColChar = '$';
                perfectCol = true;
                hasGapSet.clear();

                //for genomes not contained in the block...
                for (String id : toSuperGenome.keySet())
                    if (!seqs.keySet().contains(id)) {
                        perfectCol = false;
                        hasGapSet.add(id);
                    }

                //for all sequences in block
                for (String s : seqs.keySet()) {
                    tmpChar = seqs.get(s).getSeq().charAt(posToProcess);

                    //statistics
                    if (tmpChar == '-') {
                        perfectCol = false;
                        hasGapSet.add(s);
                    } else if (tmpColChar == '$')
                        tmpColChar = tmpChar;
                    else if (tmpColChar != tmpChar)
                        perfectCol = false;

                    //mapping
                    if (tmpChar != '-') {
                        if (seqs.get(s).getStrand() == '+')
                            tmpStrandFactor = 1;
                        else
                            tmpStrandFactor = -1;

                        fromSuperGenome.get(s)[superGenomePos] = indices.get(s) * tmpStrandFactor;
                        toSuperGenome.get(s)[indices.get(s)] = superGenomePos * tmpStrandFactor;

                        indices.put(s, indices.get(s) + nextValue.get(s));
                    }
                }

                //statistics
                if (perfectCol)
                    perfectColCount++;

                //insertion
                if (toSuperGenome.keySet().size() - hasGapSet.size() == 1) {
                    for (String id : toSuperGenome.keySet())
                        if (!hasGapSet.contains(id))
                            insCountMap.put(id, insCountMap.get(id) + 1);
                } else //deletion
                {
                    for (String id : hasGapSet)
                        delCountMap.put(id, delCountMap.get(id) + 1);
                }

            }

        }
        //Main.out.println("done");
    }


    public List<XmfaBlock> getRefBlocks() {
        return refBlocks;
    }

    public void setRefBlocks(List<XmfaBlock> refBlocks) {
        this.refBlocks = refBlocks;
    }


    /**
     * Returns for a given genome (genomeID) and position in the supergenome (superGenomePos)
     * the mapped position in genome.
     * A negative integer indicates a mapping to the reverse strand.
     * A Value of Zero indiates that there exists no mapping for this position.
     *
     * @param genomeID       - the ID of the genome
     * @param superGenomePos - position in the genome
     * @return position in genome
     */
    public int getPosInGenome(String genomeID, int superGenomePos) {
        return fromSuperGenome.get(genomeID)[superGenomePos];
    }

    public int getNextMappingPosInGenome(String genomeID, int superGenomePos) {
        int l = fromSuperGenome.get(genomeID).length;
        for (int i = superGenomePos, j = superGenomePos; i > 0 && j < l; i--, j++) {
            if (i > 0)
                if (fromSuperGenome.get(genomeID)[i] != 0)
                    return fromSuperGenome.get(genomeID)[i];
            if (j < l)
                if (fromSuperGenome.get(genomeID)[j] != 0)
                    return fromSuperGenome.get(genomeID)[j];
        }
        return 0;
    }

    /**
     * Returns for a given genome (genomeID) and position (genomePos) in that genome
     * the mapped position in the supergenome.
     * A negative integer indicates a mapping to the reverse strand.
     * A Value of Zero indicates that there exists no mapping for this position.
     *
     * @param genomeID  - the ID of the genome
     * @param genomePos - position in the genome
     * @return position in the supergenome
     */
    public int getPosInSuperGenome(String genomeID, int genomePos) {
        return toSuperGenome.get(genomeID)[genomePos];
    }

    public int getNumUngappedColumnsInRegion(int start, int end, List<String> genomeIdList) {
        //start < end?
        if (end < start) {
            int oldStart = start;
            start = end;
            end = oldStart;
        }

        //count the gapped cols, because it's easier
        int gappedCols = 0;

        //for all positions in the region...
        for (int i = start; i <= end; i++) {
            //for all genomes...
            for (String id : genomeIdList) {
                //is there a gap?
                if (fromSuperGenome.get(id)[i] == 0) {
                    gappedCols++;
                    break;
                }
            }
        }

        //region length - number of gapped cols
        return end - start + 1 - gappedCols;
    }


    /**
     * Takes a standard XY track and the respective genome ID as input and maps
     * the XY value into the supergenome's coordinate system.
     * The result is a XY track with the length of the supergenome.
     * Unmappable positions (gaps, i.e. deletions in genome) are indicated by NA values.
     *
     * @param genomeID
     * @param xyTrack
     * @return supergenome XY track with values from genome XY track
     */
    public double[] superGenomifyXYtrack(String genomeID, double xyTrack[]) {
        int[] superG = fromSuperGenome.get(genomeID);
        double[] res = new double[superG.length];

        //strand
        res[0] = 0;

        int pos;
        for (int i = 1; i < superG.length; i++) {
            pos = superG[i];
            if (pos != 0) {
                if (Math.abs(pos) >= xyTrack.length || xyTrack[Math.abs(pos)] == 0) {
                    if (Config.getString("superGraphCompatibility").equalsIgnoreCase("igb"))
                        res[i] = 0.0001;
                    else
                        res[i] = 0;

                    continue;
                }

                //       position (positive)   get correct strand   reintroduce strand in values
                res[i] = xyTrack[Math.abs(pos)] * Math.signum(pos) * xyTrack[0];

            } else if (Config.getString("superGraphCompatibility").equalsIgnoreCase("igb"))
                res[i] = 0;
            else
                res[i] = Double.NaN;
        }

        return res;
    }

    /**
     * Takes a standard XY track and its corresponding opposite strand track
     * and the respective genome ID as input and maps
     * the XY value into the supergenome's coordinate system.
     * In case of an inversion the data from the other track is used.
     * The result is a XY track with the length of the supergenome.
     * Unmappable positions (gaps, i.e. deletions in genome) are indicated by NA values.
     *
     * @param genomeID
     * @param xyTrack
     * @return supergenome XY track with values from genome XY track
     */
    public double[] superGenomifyXYtrack2trackMode(String genomeID, double xyTrack[], double otherStrandTrack[]) {
        int[] superG = fromSuperGenome.get(genomeID);
        double[] res = new double[superG.length];

        //strand
        res[0] = 0;

        int pos;
        for (int i = 1; i < superG.length; i++) {
            pos = superG[i];
            if (pos != 0) {
                if (Math.abs(pos) >= xyTrack.length || (pos > 0 && xyTrack[Math.abs(pos)] == 0) || (pos < 0 && otherStrandTrack[Math.abs(pos)] == 0)) {
                    if (Config.getString("superGraphCompatibility").equalsIgnoreCase("igb"))
                        res[i] = 0.0001;
                    else
                        res[i] = 0;

                    continue;
                }

                if (pos > 0)
                    res[i] = xyTrack[Math.abs(pos)] * xyTrack[0];
                else
                    res[i] = otherStrandTrack[Math.abs(pos)] * xyTrack[0];

            } else if (Config.getString("superGraphCompatibility").equalsIgnoreCase("igb"))
                res[i] = 0;
            else
                res[i] = Double.NaN;
        }

        return res;
    }

    /**
     * Maps the given TSS, whose positions refer to the coordinate system of 'genomeID',
     * to the SuperGenome.
     * Returns a list of TSS, whose positions refer to the coordinate system of the
     * SuperGenome.
     * Unmappable TSS are discarded.
     *
     * @param genomeID
     * @param genomeTSS
     * @return list of mapped TSS
     */
    public List<TSS> superGenomifyTSS(String genomeID, List<TSS> genomeTSS) {
        return mapTSS(genomeID, genomeTSS, true);
    }

    /**
     * Maps the given TSS, whose positions refer to the coordinate system of the SuperGenome,
     * to 'genomeID'.
     * Returns a list of TSS, whose positions refer to the coordinate system of 'genomeID'.
     * Unmappable TSS are discarded.
     *
     * @param genomeID
     * @param superGtss
     * @return list of mapped TSS
     */
    public List<TSS> genomifySuperTSS(String genomeID, List<TSS> superGtss) {
        return mapTSS(genomeID, superGtss, false);
    }

    /**
     * Maps the given TSS, whose position refers to the coordinate system of 'genomeID',
     * to the SuperGenome.
     * Returns a TSS, whose position refers to the coordinate system of the
     * SuperGenome.
     * Returns null if the TSS is unmappable.
     *
     * @param genomeID
     * @param genomeTSS
     * @return list of mapped TSS
     */
    public TSS superGenomifyTSS(String genomeID, TSS genomeTSS) {
        List<TSS> tsss = new LinkedList<TSS>();
        tsss.add(genomeTSS);

        tsss = mapTSS(genomeID, tsss, true);

        if (tsss.size() == 0)
            return null;
        else
            return tsss.get(0);
    }

    /**
     * Maps the given TSS, whose position refers to the coordinate system of the SuperGenome,
     * to 'genomeID'.
     * Returns a TSS, whose position refers to the coordinate system of 'genomeID'.
     * Returns null if the TSS is unmappable.
     *
     * @param genomeID
     * @param superGtss
     * @return list of mapped TSS
     */
    public TSS genomifySuperTSS(String genomeID, TSS superGtss) {
        List<TSS> tsss = new LinkedList<TSS>();
        tsss.add(superGtss);

        tsss = mapTSS(genomeID, tsss, false);

        if (tsss.size() == 0)
            return null;
        else
            return tsss.get(0);
    }

    private List<TSS> mapTSS(String genomeID, List<TSS> tsss, boolean mapToSuperG) {
        int[] superG;

        if (mapToSuperG)
            superG = toSuperGenome.get(genomeID);
        else
            superG = fromSuperGenome.get(genomeID);

        List<TSS> res = new LinkedList<TSS>();

        int tmpPos;
        char tmpStrand;
        TSS newTSS;
        for (TSS tss : tsss) {
            tmpPos = superG[tss.getPos()];

            if (tmpPos == 0 && mapToSuperG)
                System.out.println("WARNING: Position " + tss.getPos() + "could not be mapped to the SuperGenome!");

            if (tmpPos == 0 && !mapToSuperG)//it is a superTSS
            {
                if (tss.isDetected(genomeID)) {
                    tmpPos = tss.getGenomicTSS(genomeID).getPos();
                    tmpStrand = tss.getGenomicTSS(genomeID).getStrand();
                } else
                    continue;
            } else {
                if (tmpPos == 0)
                    continue;

                tmpStrand = tss.getStrand();
                if (tmpPos < 0)
                    tmpStrand = toggleStrand(tmpStrand);

                tmpPos = Math.abs(tmpPos);
            }

            newTSS = new TSS(tmpPos, tmpStrand, tss.getHeight(), tss.getStrictHeight(), tss.getEnrichFactor(), tss.getCliffFactor());
            newTSS.detectionSet = tss.detectionSet;
            newTSS.mappingSet = tss.mappingSet;
            newTSS.enrichmentSet = tss.enrichmentSet;
            //newTSS.gTssMap=tss.gTssMap;

            res.add(newTSS);
        }

        return res;
    }

    /**
     * Maps the given genes, whose positions refer to the coordinate system of 'genomeID'
     * to the SuperGenome.
     * Returns a list of genes, whose positions refer to the coordinate system of the
     * SuperGenome.
     * Unmappable genes are discarded.
     *
     * @param genomeID
     * @param genes
     * @return list of mapped TSS
     */
    public List<Gene> superGenomifyGenes(String genomeID, List<Gene> genes, boolean splitGenes) {
        //System.out.println("GenomeID: " + genomeID);
        return mapGenes(genomeID, genes, true, splitGenes);
    }

    /**
     * Maps the given genes, whose positions refer to the coordinate system of the SuperGenome,
     * to 'genomeID'.
     * Returns a list of genes, whose positions refer to the coordinate system of 'genomeID'.
     * Unmappable genes are discarded.
     *
     * @param genomeID
     * @param genes
     * @return list of mapped TSS
     */
    public List<Gene> genomifySuperGenes(String genomeID, List<Gene> genes) {
        return mapGenes(genomeID, genes, false, false);
    }

    public Gene genomifySuperGene(String genomeID, Gene gene) {
        List<Gene> suGenes = new LinkedList<Gene>();
        suGenes.add(gene);

        suGenes = genomifySuperGenes(genomeID, suGenes);

        if (suGenes.size() == 0)
            return null;
        else
            return suGenes.get(0);
    }

    public Gene superGenomifyGene(String genomeID, Gene gene, boolean splitGenes) {
        List<Gene> genes = new LinkedList<Gene>();
        genes.add(gene);

        genes = superGenomifyGenes(genomeID, genes, splitGenes);

        if (genes.size() == 0)
            return null;
        else
            return genes.get(0);
    }

    private List<Gene> mapGenes(String genomeID, List<Gene> genes, boolean mapToSuperG, boolean splitGenes) {
        int[] superG;

        if (mapToSuperG)
            superG = toSuperGenome.get(genomeID);
        else
            superG = fromSuperGenome.get(genomeID);

        if (mapToSuperG && splitGenes)
            genes = splitGenes(genomeID, genes);

        List<Gene> res = new LinkedList<Gene>();

        int tmpStart;
        int tmpEnd;
        char tmpStrand;
        int tmp;
        for (Gene g : genes) {
            //System.out.println("gene: " + g.getId());
            tmpStart = superG[g.getStart()];
            tmpEnd = superG[g.getEnd()];

            tmpStrand = g.getStrand();

            //check some mappability issues

            //start or end not mappable
            if (tmpStart == 0 || tmpEnd == 0)
                continue;

            //start and end on different strand
            if (Math.signum(tmpStart) != Math.signum(tmpEnd))
                continue;

            //start and end switched but without switching the strand
            //should not happen (maybe circular genome?)
            if (tmpStart > tmpEnd)
                continue;

            //strand
            if (tmpStart < 0)
                tmpStrand = toggleStrand(tmpStrand);

            tmpStart = Math.abs(tmpStart);
            tmpEnd = Math.abs(tmpEnd);

            if (tmpStart > tmpEnd) {
                tmp = tmpStart;
                tmpStart = tmpEnd;
                tmpEnd = tmp;
            }

            res.add(new Gene("super", g.getOrigin(), g.getId(), g.getType(), tmpStart, tmpEnd, tmpStrand, g.getDescription()));
        }
        return res;
    }

    /*
     * If a gene contains gaps that are too long,
     * it is split up into several parts.
     */
    private List<Gene> splitGenes(String genomeID, List<Gene> genes) {
        List<Gene> res = new LinkedList<Gene>();

        int[] superG = toSuperGenome.get(genomeID);
        int count;
        int tmpStart;

        for (Gene g : genes) {
            count = 0;
            tmpStart = g.getStart();
            for (int i = g.getStart(); i < g.getEnd(); i++) {
                if (Math.abs(Math.abs(superG[i]) - Math.abs(superG[i + 1])) > Parameters.maxGapLengthInGene) {
                    res.add(new Gene("super", g.getOrigin(), g.getId() + "_part" + (++count), g.getType(), tmpStart, i, g.getStrand(), g.getDescription()));
                    tmpStart = i + 1;
                }
            }
            if (count == 0)
                res.add(new Gene("super", g.getOrigin(), g.getId(), g.getType(), tmpStart, g.getEnd(), g.getStrand(), g.getDescription()));
            else
                res.add(new Gene("super", g.getOrigin(), g.getId() + "_part" + (++count), g.getType(), tmpStart, g.getEnd(), g.getStrand(), g.getDescription()));
        }

        return res;
    }

    public int superGenomifyXmfaStart(XmfaBlock block) {
        XmfaSequence tmpseq;

        int res = Integer.MAX_VALUE;
        int tmp;

        for (String id : block.getSeqs().keySet()) {
            tmpseq = block.getSeq(id);

            if (tmpseq.getStrand() == '-')
                tmp = tmpseq.getEnd();
            else
                tmp = tmpseq.getStart();

            if (tmp == 0)
                continue;

            res = Math.min(res, Math.abs(toSuperGenome.get(id)[tmp]));
        }

        return (res);
    }

    /**
     * Returns an int array for each genome that gives for each position (index) of the
     * SuperGenome the corresponding position in the genome.
     * The indexing is 1based (i.e. index 0 is not used).
     * A negative value means a mapping to the reverse strand.
     * A value of 0 means no mapping for this SuperGenome position.
     *
     * @param genomeIDs
     * @return int[genome_index][position]
     */
    public int[][] getSuper2GenomesAsArrayMap(String[] genomeIDs) {
        int[][] res = new int[genomeIDs.length][];

        for (int i = 0; i < genomeIDs.length; i++)
            res[i] = fromSuperGenome.get(genomeIDs[i]);

        return res;
    }

    public String superGenomifyFASTA(String genomeID, String genomeFasta) {
        int[] mapping = fromSuperGenome.get(genomeID);

        char[] superSeq = new char[mapping.length - 1];

        int pos;
        char c;
        for (int i = 1; i < mapping.length; i++) {
            if (mapping[i] == 0) {
                superSeq[i - 1] = '-';
                continue;
            }

            pos = Math.abs(mapping[i]) - 1; //genomeFasta 0based; mapping 1based
            c = genomeFasta.charAt(pos);

            if (Math.signum(mapping[i]) < 0)
                c = getComplement(c);

            superSeq[i - 1] = c;
        }

        return new String(superSeq);
    }

    public String superGenomeConsensus(Map<String, String> genomeMap) {
        char[] superSeq = new char[getAlignmentLength()];

        int pos;
        char c = 7353; //Mirror, mirror on the wall ...
        int Acount, Tcount, Ccount, Gcount, gapCount;
        int maxCount;
        int numSeqs = genomeMap.keySet().size();
        for (int i = 1; i <= superSeq.length; i++) {
            Acount = Tcount = Ccount = Gcount = gapCount = 0;
            for (String id : genomeMap.keySet()) {
                pos = Math.abs(fromSuperGenome.get(id)[i]) - 1;

                if (pos == -1) //if SuperG maps to 0, which means 'gap'
                    continue;

                c = genomeMap.get(id).charAt(pos);
                if (fromSuperGenome.get(id)[i] < 0)
                    c = getComplement(c);

                switch (c) {
                    case 'A':
                        Acount++;
                        break;
                    case 'a':
                        Acount++;
                        break;
                    case 'T':
                        Tcount++;
                        break;
                    case 't':
                        Tcount++;
                        break;
                    case 'G':
                        Gcount++;
                        break;
                    case 'g':
                        Gcount++;
                        break;
                    case 'C':
                        Ccount++;
                        break;
                    case 'c':
                        Ccount++;
                        break;
                    case '-':
                        gapCount++;
                        break;
                }
            }

            maxCount = 0;
            if (Acount > maxCount) {
                c = 'A';
                maxCount = Acount;
            }
            if (Tcount > maxCount) {
                c = 'T';
                maxCount = Tcount;
            }
            if (Ccount > maxCount) {
                c = 'C';
                maxCount = Ccount;
            }
            if (Gcount > maxCount) {
                c = 'G';
                maxCount = Gcount;
            }
            if (maxCount == 0) {
                c = 'N';
            }
            if (gapCount == numSeqs) {
                c = '-';
                //Main.out.println("WARNING: SuperGenome column "+i+" only contains gaps!\n\tThe SuperGenome consensus will contain gap symbols.");
            }


            superSeq[i - 1] = c;
        }

        return new String(superSeq);
    }

    private char getComplement(char base) {
        char complChar;

        switch (base) {
            case 'A':
                complChar = 'T';
                break;
            case 'a':
                complChar = 't';
                break;
            case 'T':
                complChar = 'A';
                break;
            case 't':
                complChar = 'a';
                break;
            case 'G':
                complChar = 'C';
                break;
            case 'g':
                complChar = 'c';
                break;
            case 'C':
                complChar = 'G';
                break;
            case 'c':
                complChar = 'g';
                break;
            case 'N':
                complChar = 'N';
                break;
            case 'n':
                complChar = 'n';
                break;
            case '-':
                complChar = '-';
                break;
            default:
                complChar = 'N';
                System.err.println("Cannot create reverse complement!");
        }

        return complChar;
    }


    private char toggleStrand(char strand) {
        char res;

        switch (strand) {
            case '+':
                res = '-';
                break;
            case '-':
                res = '+';
                break;
            case '.':
                res = '.';
                break;
            default:
                res = '.';
                System.out.println("Warning: Invalid strand identifier in toggleStrand function: " + strand);
        }

        return res;
    }

    private class BlockComparator implements Comparator<XmfaBlock> {
        private String[] myRefGenome;

        public BlockComparator(String[] refGenome) {
            super();
            this.myRefGenome = refGenome;
        }

        @Override
        public int compare(XmfaBlock b1, XmfaBlock b2) {
            int b1Start = 0;
            int b2Start = 0;
            for (int i = 0; i < myRefGenome.length; i++) {
                if (b1.getSeqs().containsKey(myRefGenome[i]) && b2.getSeqs().containsKey(myRefGenome[i])) {
                    b1Start = b1.getSeqs().get(myRefGenome[i]).getStart();
                    b2Start = b2.getSeqs().get(myRefGenome[i]).getStart();
                    break;
                }
            }

            return b1Start - b2Start;
        }

    }

    private static List<XmfaBlock> sortBlocks(List<XmfaBlock> blocks, String[] refGenomes) {
        List<XmfaBlock> in = new LinkedList<XmfaBlock>(blocks);
        List<XmfaBlock> out = new LinkedList<XmfaBlock>();

        List<XmfaBlock> toBeRemoved = new LinkedList<XmfaBlock>();
        int tmpInsertIndex;
        boolean insertAtLastPos;
        XmfaBlock tmpBlock;

        for (String id : refGenomes) {
            toBeRemoved.clear();

            //insert blocks in out out list
            for (XmfaBlock block : in) {
                //consider only blocks in current genome
                if (!block.getSeqs().containsKey(id))
                    continue;

                toBeRemoved.add(block);

                //first block
                if (out.size() == 0) {
                    out.add(block);
                    continue;
                }


                //check all blocks already in out list
                tmpInsertIndex = -1; //stays at -1 if first block of the genome -> becomes 0 because insertAtLastPos=T
                insertAtLastPos = true;
                for (int i = 0; i < out.size(); i++) {
                    tmpBlock = out.get(i);

                    //consider only blocks in current genome
                    if (!tmpBlock.getSeqs().containsKey(id))
                        continue;

                    //update position
                    tmpInsertIndex = i;

                    //insertion point found?
                    if (block.getSeq(id).getStart() < tmpBlock.getSeq(id).getStart()) {
                        insertAtLastPos = false;
                        break;
                    }
                }

                //Insert at last position? (Or first position if first block of the genome)
                if (insertAtLastPos)
                    tmpInsertIndex++;

                //insert
                out.add(tmpInsertIndex, block);
                toBeRemoved.add(block);
            }

            //remove inserted blocks from in list
            in.removeAll(toBeRemoved);
        }

        return out;
    }

    public int getPerfectColCount() {
        return perfectColCount;
    }

    public Map<String, Integer> getDelCountMap() {
        return delCountMap;
    }

    public Map<String, Integer> getInsCountMap() {
        return insCountMap;
    }

    public int getAlignmentLength() {
        int res = 0;
        for (String id : fromSuperGenome.keySet()) {
            res = fromSuperGenome.get(id).length - 1; //because array is one position longer
            break;
        }
        return res;
    }
}
